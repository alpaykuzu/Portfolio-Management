export interface CreatePortfolioItemRequest {
  portfolioId: number;
  symbol: string;
  quantity: number;
  buyPrice: number;
  purchaseDate: Date;
}
