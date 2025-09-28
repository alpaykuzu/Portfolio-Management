import React, { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import type { LoginResponse } from "../types/Auth/LoginResponse";
import { AuthService } from "../services/AuthService";
import { SignalRService } from "../services/SignalRService";

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  id: number | null;
  login: (data: LoginResponse) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState(Cookies.get("accessToken"));
  const [refreshToken, setRefreshToken] = useState(Cookies.get("refreshToken"));
  const [id, setId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const signalRService = SignalRService.getInstance(); // Servisi dışarıda oluştur

  const login = async (data: LoginResponse) => {
    // Tokenları ayarla
    setAccessToken(data.accessToken.accessToken);
    setRefreshToken(data.refreshToken.refreshToken);
    setId(data.userInfo.id);

    const accessExp = new Date(data.accessToken.accessTokenExpTime);
    const refreshExp = new Date(data.refreshToken.refreshTokenExpTime);

    Cookies.set("accessToken", data.accessToken.accessToken, {
      expires: accessExp,
    });
    Cookies.set("refreshToken", data.refreshToken.refreshToken, {
      expires: refreshExp,
    });

    // SignalR bağlantısını yeni token ile yenile
    try {
      await signalRService.refreshConnection();
    } catch (error) {
      console.error("Failed to refresh SignalR connection after login:", error);
    }
  };

  const logout = async () => {
    // SignalR bağlantısını tamamen durdur ve temizle (default clearHandlers=true)
    try {
      await signalRService.stopConnection();
    } catch (error) {
      console.error("Error stopping SignalR connection:", error);
    }

    setAccessToken("");
    setRefreshToken("");
    setId(null);
    Object.keys(Cookies.get()).forEach((cookie) => Cookies.remove(cookie));
    window.location.href = "/";
  };

  // Initialize auth on page refresh
  useEffect(() => {
    const initAuth = async () => {
      const access = Cookies.get("accessToken");
      if (!access) {
        setLoading(false);
        return;
      }

      try {
        const response = await AuthService.me();
        if (response.success && response.data) {
          setId(response.data.id);

          // SignalR bağlantısını başlat
          try {
            await signalRService.startConnection();
          } catch (error) {
            console.error("Failed to initialize SignalR connection:", error);
          }
        } else {
          // Token var ama /me başarısız, muhtemelen token süresi doldu/geçersiz
          await logout();
        }
      } catch {
        await logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    // useEffect'ten dönen temizleme fonksiyonunda SignalR bağlantısını durdurmuyoruz,
    // çünkü sayfa yenilendiğinde tekrar başlatılması gerekiyor. Sadece logout'ta durdurulmalı.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sadece ilk render'da çalışır

  // Refresh token interval
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const access = Cookies.get("accessToken");
      const refresh = Cookies.get("refreshToken");
      const currentPath = window.location.pathname;

      if (!refresh) {
        if (currentPath !== "/login" && currentPath !== "/register") {
          await logout();
        }
        return;
      }

      // Giriş/kayıt sayfalarındaysak ve refresh token varsa, access token'ın olmaması normal.
      if (
        !access &&
        (currentPath === "/login" || currentPath === "/register")
      ) {
        return;
      }

      if (!access) {
        try {
          const response = await AuthService.refreshToken({
            refreshToken: refresh,
          });
          const data = response.data;

          // State ve Cookie'leri güncelle
          setAccessToken(data.accessToken.accessToken);
          setRefreshToken(data.refreshToken.refreshToken);

          const accessExp = new Date(data.accessToken.accessTokenExpTime);
          const refreshExp = new Date(data.refreshToken.refreshTokenExpTime);

          Cookies.set("accessToken", data.accessToken.accessToken, {
            expires: accessExp,
          });
          Cookies.set("refreshToken", data.refreshToken.refreshToken, {
            expires: refreshExp,
          });

          // SignalR bağlantısını yeni token ile yenile
          // Bağlantı kurulmaya çalışılıyorsa veya bağlıysa yenile
          const connectionState = signalRService.getConnectionState();

          if (connectionState !== null) {
            try {
              await signalRService.refreshConnection();
            } catch (error) {
              console.error(
                "Failed to refresh SignalR after token refresh:",
                error
              );
            }
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
          await logout();
        }
      }
    }, 2000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sadece ilk render'da çalışır

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider
      value={{
        accessToken: accessToken ?? null,
        refreshToken: refreshToken ?? null,
        id: id ?? null,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
