import type { PortfolioItemResponse } from "./PortfoloItemResponse";

export interface PortfolioResponse {
  id: number;
  type: string; //stock, crypto
  totalValue: number;
  totalInvestment: number;
  totalProfit: number;
  profitPercentage: number;
  items: PortfolioItemResponse[];
}
