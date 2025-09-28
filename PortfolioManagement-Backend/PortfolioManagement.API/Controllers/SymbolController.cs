using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PortfolioManagement.Core.Interfaces;
using System.Threading.Tasks;

namespace PortfolioManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SymbolController : ControllerBase
    {
        private readonly ISymbolService _symbolService;

        public SymbolController(ISymbolService symbolService)
        {
            _symbolService = symbolService;
        }

        [HttpGet("get-all-BIST-stok-symbols")]
        public async Task<IActionResult> GetAllBISTStockSymbols() => Ok(await _symbolService.GetAllBISTSymbolAsync());

        [HttpGet("get-all-crypto-symbols")]
        public async Task<IActionResult> GetAllCryptoSymbols() => Ok(await _symbolService.GetAllCryptoSymbolAsync());

        [HttpGet("search-by-BIST-stock-symbol/{symbol}")]
        public async Task<IActionResult> GetByBISTSymbol(string symbol)
        {
            return Ok(await _symbolService.SearchByBISTSymbolAsync(symbol));
        }
        [HttpGet("search-by-crypto-symbol/{symbol}")]
        public async Task<IActionResult> GetByCryptoSymbol(string symbol)
        {
            return Ok(await _symbolService.SearchByCryptoSymbolAsync(symbol));
        }
    }
}
