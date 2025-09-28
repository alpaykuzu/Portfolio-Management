using Microsoft.Extensions.Logging;
using PortfolioManagement.Core.Interfaces;
using PortfolioManagement.Core.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Service.Services
{
    public class PriceService : IPriceService
    {
        private readonly IBinanceService _binanceService;
        private readonly YahooFinanceService _yahooService;
        private readonly ILogger<PriceService> _logger;

        public PriceService(IBinanceService binanceService, YahooFinanceService yahooService, ILogger<PriceService> logger)
        {
            _binanceService = binanceService;
            _yahooService = yahooService;
            _logger = logger;
        }

        public async Task<ApiResponse<string>> GetPriceAsync(string symbol, string assetType)
        {
            try
            {
                return assetType.ToLower() switch
                {
                    "crypto" => ApiResponse<string>.Ok(await _binanceService.GetPriceAsync(symbol), "Başarılı."),
                    "stock" => ApiResponse<string>.Ok(await _yahooService.GetPriceAsync(symbol), "Başarılı."),
                    _ => throw new ArgumentException($"Desteklenmeyen varlık türü: {assetType}")
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Fiyat alınamadı: {symbol} ({assetType}) - {ex.Message}");
                return ApiResponse<string>.Fail("Fiyat alınamadı.");
            }
        }
    }
}
