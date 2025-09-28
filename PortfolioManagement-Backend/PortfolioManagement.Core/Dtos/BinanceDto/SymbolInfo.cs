namespace PortfolioManagement.Core.Dtos.BinanceDto
{
    public class SymbolInfo
    {
        public string symbol { get; set; }      // e.g. "BTCUSDT"
        public string status { get; set; }      // "TRADING"
        public string baseAsset { get; set; }   // "BTC"
        public string quoteAsset { get; set; }  // "USDT"
    }
}
