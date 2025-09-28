using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PortfolioManagement.Core.Interfaces;

namespace PortfolioManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PriceController : ControllerBase
    {
        private readonly IPriceService _priceService;
        public PriceController(IPriceService priceService)
        {
            _priceService = priceService;
        }
        [HttpGet("get-price/{symbol}/{assetType}")]
        public async Task<IActionResult> GetPrice(string symbol, string assetType)
        {
            return Ok(await _priceService.GetPriceAsync(symbol, assetType));
        }
    }
}
