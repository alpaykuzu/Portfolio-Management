using PortfolioManagement.Core.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Core.Interfaces
{
    public interface IPriceService
    {
        Task<ApiResponse<string>> GetPriceAsync(string symbol, string assetType);
        //Task<Dictionary<string, decimal>> GetMultiplePricesAsync(List<string> symbols);
    }
}
