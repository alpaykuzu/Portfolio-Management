export interface PortfolioItemResponse {
  id: number;
  symbol: string;
  buyPrice: number;
  quantity: number;
  currentPrice: number;
  totalValue: number;
  profit: number;
  profitPercentage: number;
  purchaseDate: Date;
}
