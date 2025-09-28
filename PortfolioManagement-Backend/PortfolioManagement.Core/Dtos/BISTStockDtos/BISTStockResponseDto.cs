using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace PortfolioManagement.Core.Dtos.BISTStockDtos
{
    public class BISTStockResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } 
        public string Symbol { get; set; }
        public string? LogoUrl { get; set; } 
    }
}
