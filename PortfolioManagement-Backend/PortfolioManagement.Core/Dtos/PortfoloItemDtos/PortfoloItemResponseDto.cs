using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Core.Dtos.PortfoloItemDtos
{
    public class PortfoloItemResponseDto
    {
        public int Id { get; set; }
        public string Symbol { get; set; }
        public decimal BuyPrice { get; set; }
        public int Quantity { get; set; }
        public decimal CurrentPrice { get; set; }
        public decimal TotalValue { get; set; }
        public decimal Profit { get; set; }
        public decimal ProfitPercentage { get; set; }
        public DateTime PurchaseDate { get; set; }
    }
}
