namespace PortfolioManagement.Core.Dtos.PortfoloItemDtos
{
    public class UpdatePortfolioItemRequestDto
    {
        public int PortfolioId { get; set; }
        public int Quantity { get; set; }
        public decimal BuyPrice { get; set; }
    }
}
