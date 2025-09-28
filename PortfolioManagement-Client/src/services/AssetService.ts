import type { ApiResponse } from "../types/ApiResponse";
import type { BISTStockResponse } from "../types/BISTStock/BISTStockResponse";
import type { CryptoAssetResponse } from "../types/CryptoAsset/CryptoAssetResponse";
import { BaseService } from "./BaseService";

export class AssetService {
  private static readonly APIURL = "https://localhost:7285/api";

  static async getAllBISTStockSymbolAsync(): Promise<
    ApiResponse<BISTStockResponse>
  > {
    const response = await BaseService.requestWithoutToken<BISTStockResponse>(
      this.APIURL + "/Symbol/get-all-BIST-stok-symbols"
    );
    if (!response.success) {
      throw new Error(response.message || "Sembol getirme  başarısız");
    }
    return response;
  }

  static async getAllCryptoSymbolAsync(): Promise<
    ApiResponse<CryptoAssetResponse>
  > {
    const response = await BaseService.requestWithoutToken<CryptoAssetResponse>(
      this.APIURL + "/Symbol/get-all-crypto-symbols"
    );
    if (!response.success) {
      throw new Error(response.message || "Sembol getirme  başarısız");
    }
    return response;
  }

  static async searchBISTStockSymbolAsync(
    symbol: string
  ): Promise<ApiResponse<BISTStockResponse[]>> {
    const response = await BaseService.requestWithoutToken<BISTStockResponse[]>(
      `${this.APIURL}/Symbol/search-by-BIST-stock-symbol/${symbol}`
    );

    if (!response.success) {
      throw new Error(response.message || "Sembol getirme  başarısız");
    }

    return response;
  }

  static async searchCryptoAssetSymbolAsync(
    symbol: string
  ): Promise<ApiResponse<CryptoAssetResponse[]>> {
    const response = await BaseService.requestWithoutToken<
      CryptoAssetResponse[]
    >(`${this.APIURL}/Symbol/search-by-crypto-symbol/${symbol}`);

    if (!response.success) {
      throw new Error(response.message || "Sembol getirme  başarısız");
    }

    return response;
  }

  static async getPriceAsync(
    symbol: string,
    assetType: string //stock , crypto
  ): Promise<ApiResponse<string>> {
    const response = await BaseService.requestWithoutToken<string>(
      `${this.APIURL}/Price/get-price/${symbol}/${assetType}`
    );

    if (!response.success) {
      throw new Error(response.message || "Sembol getirme  başarısız");
    }

    return response;
  }
}
