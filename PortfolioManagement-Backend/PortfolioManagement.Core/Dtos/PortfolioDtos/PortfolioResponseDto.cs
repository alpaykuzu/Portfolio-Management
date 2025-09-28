using PortfolioManagement.Core.Dtos.PortfoloItemDtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Core.Dtos.PortfolioDtos
{
    public class PortfolioResponseDto
    {
        public int Id { get; set; }
        public string Type { get; set; } //stock, crypto
        public decimal TotalValue { get; set; }
        public decimal TotalInvestment { get; set; }
        public decimal TotalProfit { get; set; }
        public decimal ProfitPercentage { get; set; }
        public IEnumerable<PortfoloItemResponseDto> Items { get; set; }
    }
}
