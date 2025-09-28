using Microsoft.Extensions.Logging;
using PortfolioManagement.Core.Dtos.BinanceDto;
using PortfolioManagement.Core.Interfaces;
using System.Text.Json;
using System.Threading.Tasks;
using System.Globalization; // Kültür ayarları için
using System.Collections.Generic;
using System.Linq;

namespace PortfolioManagement.Service.Services
{
    public class BinanceService : IBinanceService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<BinanceService> _logger;
        private const string BASE_URL = "https://api.binance.com/api/v3";

        public BinanceService(HttpClient httpClient, ILogger<BinanceService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        private async Task<decimal> GetUsdtToTryRateAsync()
        {
            try
            {
                // Binance'teki USDT/TRY paritesini çekiyoruz.
                string tradingPair = "USDTTRY";
                string url = $"{BASE_URL}/ticker/price?symbol={tradingPair}";

                var response = await _httpClient.GetStringAsync(url);
                var priceData = JsonSerializer.Deserialize<BinancePriceResponse>(response);

                if (decimal.TryParse(priceData.price, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal rate))
                {
                    return rate;
                }

                _logger.LogWarning($"USDTTRY kuru string'den decimal'e çevrilemedi: {priceData.price}");
                return 0;

            }
            catch (Exception ex)
            {
                _logger.LogError($"USDTTRY kuru çekilemedi: {ex.Message}");
                return 0;
            }
        }


        public async Task<string> GetPriceAsync(string symbol)
        {
            try
            {
                decimal tryRate = await GetUsdtToTryRateAsync();
                if (tryRate == 0) return "0";

                string tradingPair = symbol.ToUpper() + "USDT";
                string url = $"{BASE_URL}/ticker/price?symbol={tradingPair}";

                var response = await _httpClient.GetStringAsync(url);
                var priceData = JsonSerializer.Deserialize<BinancePriceResponse>(response);

                if (decimal.TryParse(priceData.price, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal usdtPrice))
                {
                    decimal tryPrice = usdtPrice * tryRate;

                    return tryPrice.ToString(CultureInfo.InvariantCulture);
                }

                _logger.LogError($"Kripto fiyatı string'den decimal'e çevrilemedi: {priceData.price}");
                return "0";
            }
            catch (Exception ex)
            {
                _logger.LogError($"Binance fiyat çekilemedi: {symbol} - {ex.Message}");
                return "0";
            }
        }

        // exchangeInfo: returns all trading pairs
        public async Task<ExchangeInfoResponse?> GetExchangeInfoAsync()
        {
            string url = $"{BASE_URL}/exchangeInfo";
            var res = await _httpClient.GetStringAsync(url);
            return JsonSerializer.Deserialize<ExchangeInfoResponse>(res);
        }

        public async Task<Dictionary<string, string>> GetMultiplePricesAsync(List<string> symbols)
        {
            var prices = new Dictionary<string, string>();

            try
            {
                decimal tryRate = await GetUsdtToTryRateAsync();
                if (tryRate == 0) return prices;

                var symbolsParam = string.Join(",", symbols.Select(s => $"\"{s}USDT\""));
                string url = $"{BASE_URL}/ticker/price?symbols=[{symbolsParam}]";

                var response = await _httpClient.GetStringAsync(url);
                var priceDataArray = JsonSerializer.Deserialize<BinancePriceResponse[]>(response);

                foreach (var item in priceDataArray)
                {
                    string symbol = item.symbol.Replace("USDT", "");

                    if (decimal.TryParse(item.price, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal usdtPrice))
                    {
                        decimal tryPrice = usdtPrice * tryRate;
                        prices[symbol] = tryPrice.ToString(CultureInfo.InvariantCulture);
                    }
                    else
                    {
                        _logger.LogWarning($"Çoklu fiyat çekiminde dönüştürme hatası: {item.symbol}");
                        prices[symbol] = "0";
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Binance çoklu fiyat çekilemedi - {ex.Message}");
            }

            return prices;
        }
    }
}