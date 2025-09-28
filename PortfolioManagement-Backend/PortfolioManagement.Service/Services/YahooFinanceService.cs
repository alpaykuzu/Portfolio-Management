using Microsoft.Extensions.Logging;
using PortfolioManagement.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace PortfolioManagement.Service.Services
{
    public class YahooFinanceService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<YahooFinanceService> _logger;

        public YahooFinanceService(HttpClient httpClient, ILogger<YahooFinanceService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;

             if (!_httpClient.DefaultRequestHeaders.UserAgent.Any())
    {
        _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    }
        }

        public async Task<string> GetPriceAsync(string symbol)
        {
            try
            {
                string url = $"https://query1.finance.yahoo.com/v8/finance/chart/{symbol.ToUpper()}.IS";

                var response = await _httpClient.GetStringAsync(url);
                var data = JsonSerializer.Deserialize<YahooFinanceResponse>(response);

                var price = data.chart.result[0].meta.regularMarketPrice;
                return price.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Yahoo Finance fiyat çekilemedi: {symbol} - {ex.Message}");
                return "0";
            }
        }

        public async Task<Dictionary<string, string>> GetMultiplePricesAsync(List<string> symbols)
        {
            var prices = new Dictionary<string, string>();
            var tasks = symbols.Select(async symbol =>
            {
                var price = await GetPriceAsync(symbol);
                if (decimal.Parse(price) > 0) prices[symbol] = price;
            });

            await Task.WhenAll(tasks);
            return prices;
        }
    }

    public class YahooFinanceResponse
    {
        public YahooChart chart { get; set; }
    }

    public class YahooChart
    {
        public YahooResult[] result { get; set; }
    }

    public class YahooResult
    {
        public YahooMeta meta { get; set; }
    }

    public class YahooMeta
    {
        public decimal regularMarketPrice { get; set; }
    }
}
