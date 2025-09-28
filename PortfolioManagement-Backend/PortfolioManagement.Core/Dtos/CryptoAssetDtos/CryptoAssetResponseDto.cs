using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Core.Dtos.CryptoDtos
{
    public class CryptoAssetResponseDto
    {
        public int Id { get; set; }
        public string Symbol { get; set; }    // "BTC"
        public string DisplaySymbol { get; set; } // "BTC/TRY" veya "BTC/USDT"
    }
}
