using PortfolioManagement.Core.Interfaces;
using PortfolioManagement.Core.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace PortfolioManagement.Data.Initializers
{
    public static class DbInitializer
    {
        // BIST Stocks JSON'dan DB'ye seed
        public static async Task SeedBISTStocksAsync(AppDbContext context)
        {
            if (!context.BISTStocks.Any())
            {
                var path = "../PortfolioManagement.Data/Seeds/bist.json";
                using (var reader = new StreamReader(path, Encoding.UTF8, true))
                {
                    var jsonString = await reader.ReadToEndAsync();
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    };
                    var stocks = JsonSerializer.Deserialize<List<BISTStock>>(jsonString, options);

                    if (stocks != null && stocks.Count > 0)
                    {
                        await context.BISTStocks.AddRangeAsync(stocks);
                        await context.SaveChangesAsync();
                    }
                }
            }
        }

        // Binance API'den Crypto varlıkları DB'ye seed
        public static async Task SeedCryptoAssetsFromBinanceAsync(AppDbContext context, IBinanceService binanceService)
        {
            // zaten varsa atla
            if (context.Set<CryptoAsset>().Any()) return;

            var info = await binanceService.GetExchangeInfoAsync();
            if (info?.symbols == null) return;

            // Benzersiz baseAsset'leri al, isteğe göre quote filtrele
            var baseAssets = info.symbols
                .Where(s => s.status == "TRADING")
                .Where(s => s.quoteAsset == "USDT" || s.quoteAsset == "TRY")
                .Select(s => s.baseAsset)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var entities = baseAssets.Select(b => new CryptoAsset
            {
                Symbol = b,
                DisplaySymbol = b,
                Source = "BINANCE"
            }).ToList();

            if (entities.Any())
            {
                await context.Set<CryptoAsset>().AddRangeAsync(entities);
                await context.SaveChangesAsync();
            }
        }
    }
}
