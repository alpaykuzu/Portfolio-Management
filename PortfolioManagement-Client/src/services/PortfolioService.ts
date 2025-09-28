import type { ApiResponse } from "../types/ApiResponse";
import type { CreatePortfolioItemRequest } from "../types/Portfolio/CreatePortfolioItemRequest";
import type { PortfolioResponse } from "../types/Portfolio/PortfolioResponse";
import type { UpdatePortfolioItemRequest } from "../types/Portfolio/UpdatePortfolioItemRequest";
import { BaseService } from "./BaseService";

export class PortfolioService {
  private static readonly APIURL = "https://localhost:7285/api";

  static async getAllPortfolioAsync(): Promise<
    ApiResponse<PortfolioResponse[]>
  > {
    const response = await BaseService.requestWithToken<PortfolioResponse[]>(
      this.APIURL + "/Portfolio/get-all-portfolio-by-user"
    );

    if (!response.success) {
      throw new Error(response.message || "Portfolyo getirme  başarısız");
    }

    return response;
  }

  static async getPortfolioAsync(
    portfolioId: number
  ): Promise<ApiResponse<PortfolioResponse>> {
    const response = await BaseService.requestWithToken<PortfolioResponse>(
      `${this.APIURL}/Portfolio/get-portfolio-by-user/${portfolioId}`
    );

    if (!response.success) {
      throw new Error(response.message || "Portfolyo getirme  başarısız");
    }

    return response;
  }

  static async addAssetToPortfolioAsync(
    req: CreatePortfolioItemRequest
  ): Promise<ApiResponse<null>> {
    const response = await BaseService.requestWithToken<null>(
      this.APIURL + "/Portfolio/add-item-to-portfolio",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      }
    );

    if (!response.success) {
      throw new Error(response.message || "Asset ekleme  başarısız");
    }

    return response;
  }

  static async createPortfolioAsync(
    type: string //stock, crypto
  ): Promise<ApiResponse<null>> {
    const response = await BaseService.requestWithToken<null>(
      `${this.APIURL}/Portfolio/create-portfolio/${type}`
    );

    if (!response.success) {
      throw new Error(response.message || "Portfolyo oluşturma başarısız");
    }

    return response;
  }

  static async deletePortfolioAsync(
    portfolioId: number
  ): Promise<ApiResponse<null>> {
    const response = await BaseService.requestWithToken<null>(
      `${this.APIURL}/Portfolio/delete-portfolio/${portfolioId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.success) {
      throw new Error(response.message || "Portfolyo silme başarısız");
    }

    return response;
  }
  static async deletePortfolioItemAsync(
    portfolioItemId: number
  ): Promise<ApiResponse<null>> {
    const response = await BaseService.requestWithToken<null>(
      `${this.APIURL}/Portfolio/delete-portfolio-item/${portfolioItemId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.success) {
      throw new Error(response.message || "Portfolyo silme başarısız");
    }

    return response;
  }

  static async updatePortfolioItemAsync(
    req: UpdatePortfolioItemRequest
  ): Promise<ApiResponse<null>> {
    const response = await BaseService.requestWithToken<null>(
      this.APIURL + "/Portfolio/update-portfolio-item",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      }
    );

    if (!response.success) {
      throw new Error(response.message || "Asset güncelleme  başarısız");
    }

    return response;
  }
}
