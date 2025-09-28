using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Core.Dtos.BinanceDto
{
    public class BinancePriceResponse
    {
        public string symbol { get; set; }
        public string price { get; set; }
    }
}
