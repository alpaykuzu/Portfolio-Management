using PortfolioManagement.Core.Dtos.BinanceDto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Core.Interfaces
{
    public interface IBinanceService
    {
        Task<string> GetPriceAsync(string symbol);
        Task<ExchangeInfoResponse?> GetExchangeInfoAsync();
        Task<Dictionary<string, string>> GetMultiplePricesAsync(List<string> symbols);
    }
}
