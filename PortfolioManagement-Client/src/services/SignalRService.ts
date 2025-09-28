/* eslint-disable @typescript-eslint/no-explicit-any */
import * as signalR from "@microsoft/signalr";
import Cookies from "js-cookie";

type ConnectionCallback = (...args: any[]) => void;

export class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private static instance: SignalRService;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private maxRetries: number = 5;
  private currentRetries: number = 0;
  private connectionPromise: Promise<void> | null = null;

  // Yeni: Tüm kayıtlı handler'ları tutan Map yapısı
  private handlers: Map<string, Set<ConnectionCallback>> = new Map();

  private constructor() {}

  public static getInstance(): SignalRService {
    if (!SignalRService.instance) {
      SignalRService.instance = new SignalRService();
    }
    return SignalRService.instance;
  }

  public async startConnection(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.isConnected()) {
      return Promise.resolve();
    }

    this.connectionPromise = this._startConnectionInternal();

    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async _startConnectionInternal(): Promise<void> {
    try {
      const accessToken = Cookies.get("accessToken");

      if (!accessToken) {
        console.warn("No access token available for SignalR connection");
        return;
      }

      // Stop existing connection if any
      if (this.connection) {
        await this.stopConnection(false); // Stop but don't clear handlers
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:7285/portfolioHub", {
          accessTokenFactory: () => {
            const token = Cookies.get("accessToken");
            return token || "";
          },
          skipNegotiation: false,
          transport:
            signalR.HttpTransportType.WebSockets |
            signalR.HttpTransportType.ServerSentEvents |
            signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            const delays = [0, 2000, 10000, 30000];
            const delay = delays[retryContext.previousRetryCount] || null;
            return delay;
          },
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Connection event handlers
      this.connection.onreconnecting((error) => {
        console.log(
          "SignalR connection lost, attempting to reconnect...",
          error
        );
      });

      this.connection.onreconnected((connectionId) => {
        console.log("SignalR connection reestablished", connectionId);
        this.currentRetries = 0;
        this._registerHandlers(); // Handler'ları tekrar kaydet
        this.joinUserGroup();
      });

      this.connection.onclose(async (error) => {
        console.log("SignalR connection closed", error);

        if (
          error?.message?.includes("401") ||
          error?.message?.includes("Unauthorized")
        ) {
          console.log(
            "Authentication error detected, will retry with fresh token"
          );
          // AutomaticReconnect will try to handle this. If it fails, scheduleReconnect will be triggered on start error.
        }
      });

      await this.connection.start();
      console.log("SignalR connection started successfully");

      // Yeni: Başarılı bağlantıdan sonra tüm handler'ları tekrar kaydet
      this._registerHandlers();

      await this.joinUserGroup();
      this.currentRetries = 0;
    } catch (error) {
      console.error("Error starting SignalR connection:", error);
      if (this.currentRetries < this.maxRetries) {
        this.scheduleReconnect();
      }
      throw error;
    }
  }

  private _registerHandlers(): void {
    if (!this.connection) return;

    this.handlers.forEach((callbacks, methodName) => {
      callbacks.forEach((callback) => {
        // Yeni bağlantıya kaydetmeden önce eski bağlantıdan kaldırmak gerekli değil.
        // Yeni bir bağlantı nesnesi olduğu için, on() çağrısı güvenlidir.
        this.connection!.on(methodName, callback);
      });
    });
    console.log(
      `SignalR: Registered ${
        this.handlers.get("update")?.size || 0
      } 'update' handlers.`
    );
  }

  private async joinUserGroup(): Promise<void> {
    if (this.connection && this.isConnected()) {
      try {
        await this.connection.invoke("JoinUserGroup");
        console.log("Successfully joined user group");
      } catch (error) {
        console.error("Failed to join user group:", error);
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.currentRetries >= this.maxRetries) {
      console.log("Max reconnection attempts reached, stopping reconnection");
      return;
    }

    const delay = Math.min(5000 * Math.pow(2, this.currentRetries), 30000);
    this.currentRetries++;

    console.log(
      `Scheduling reconnection attempt ${this.currentRetries}/${this.maxRetries} in ${delay}ms`
    );

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.startConnection();
      } catch (error) {
        console.error("Reconnection attempt failed:", error);
      }
    }, delay);
  }

  public async refreshConnection(): Promise<void> {
    console.log("Refreshing SignalR connection with new token");
    this.currentRetries = 0;
    this.connectionPromise = null;

    if (this.connection) {
      await this.stopConnection(false); // Handler'ları koruyarak durdur
    }

    await this.startConnection(); // Yeni bağlantı başlarken handler'lar tekrar kaydedilecek
  }

  // Yeni on/off metotları: Handler'ı dahili Set'e ekler/kaldırır
  public onPortfolioUpdated(callback: (portfolios: any) => void): void {
    let callbacks = this.handlers.get("update");
    if (!callbacks) {
      callbacks = new Set();
      this.handlers.set("update", callbacks);
    }
    callbacks.add(callback);

    // Eğer bağlıysak, hemen yeni bağlantıya kaydet
    if (this.connection) {
      this.connection.on("update", callback);
    }
  }

  public offPortfolioUpdated(callback: (portfolios: any) => void): void {
    const callbacks = this.handlers.get("update");
    if (callbacks) {
      callbacks.delete(callback);
    }
    // Bağlantıdan da kaldır
    if (this.connection) {
      this.connection.off("update", callback);
    }
  }

  // stopConnection metodunu güncelle
  public async stopConnection(clearHandlers: boolean = true): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.currentRetries = 0;
    this.connectionPromise = null;

    if (
      this.connection &&
      this.connection.state !== signalR.HubConnectionState.Disconnected
    ) {
      try {
        if (this.isConnected()) {
          await this.connection.invoke("LeaveUserGroup");
        }

        // Önemli: Eğer handler'ları temizlemeyeceksek, off() çağrısı yapmamalıyız.
        // Ancak yeni bağlantı kurulduğunda eski event'leri korumak için Set kullandık.
        // stop() metodunun kendisi zaten tüm handler'ları bağlantı nesnesinden kaldırır.
        await this.connection.stop();
        console.log("SignalR connection stopped");
      } catch (error) {
        console.error("Error stopping SignalR connection:", error);
      }
    }

    this.connection = null;

    if (clearHandlers) {
      this.handlers.clear();
    }
  }

  public getConnectionState(): signalR.HubConnectionState | null {
    return this.connection?.state ?? null;
  }

  public isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  public resetRetryCount(): void {
    this.currentRetries = 0;
  }

  public async ensureConnection(): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        await this.startConnection();
      }
      return this.isConnected();
    } catch (error) {
      console.error("Failed to ensure connection:", error);
      return false;
    }
  }
}
