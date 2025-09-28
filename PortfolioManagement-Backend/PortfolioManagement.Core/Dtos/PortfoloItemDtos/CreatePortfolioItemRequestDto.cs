using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Core.Dtos.PortfoloItemDtos
{
    public class CreatePortfolioItemRequestDto
    {
        public int PortfolioId { get; set; }
        public string Symbol { get; set; }
        public int Quantity { get; set; }
        public decimal BuyPrice { get; set; }
        public DateTime PurchaseDate { get; set; }
    }
}
