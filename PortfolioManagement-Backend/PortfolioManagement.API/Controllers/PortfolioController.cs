using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PortfolioManagement.Core.Dtos.PortfolioDtos;
using PortfolioManagement.Core.Dtos.PortfoloItemDtos;
using PortfolioManagement.Core.Interfaces;
using System.Security.Claims;

namespace PortfolioManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PortfolioController : ControllerBase
    {
        private readonly IPortfolioService _portfolioService;

        public PortfolioController(IPortfolioService portfolioService)
        {
            _portfolioService = portfolioService;
        }

        [HttpGet("get-all-portfolio-by-user")]
        public async Task<IActionResult> GetPortfolioValue()
        {
            return Ok(await _portfolioService.GetAllPortfoliosAsync());
        }

        [HttpGet("get-portfolio-by-user/{portfolioId}")]
        public async Task<IActionResult> GetPortfolioValue(int portfolioId)
        {
            return Ok(await _portfolioService.GetPortfolioAsync(portfolioId));
        }

        [HttpPost("add-item-to-portfolio")]
        public async Task<IActionResult> AddAsset([FromBody] CreatePortfolioItemRequestDto request)
        {
            return Ok(await _portfolioService.AddAssetToPortfolioAsync(request));
        }
        [HttpGet("create-portfolio/{type}")]
        public async Task<IActionResult> CreatePortfolio(string type)
        {
            return Ok(await _portfolioService.CreatePortfolioAsync(type));
        }
        [HttpDelete("delete-portfolio/{portfolioId}")]
        public async Task<IActionResult> DeletePortfolio(int portfolioId)
        {
            return Ok(await _portfolioService.DeletePortfolioAsync(portfolioId));
        }
        [HttpDelete("delete-portfolio-item/{portfolioItemId}")]
        public async Task<IActionResult> DeletePortfolioItem(int portfolioItemId)
        {
            return Ok(await _portfolioService.DeletePortfolioItemAsync(portfolioItemId));
        }
        [HttpPut("update-portfolio-item/{portfolioItemId}")]
        public async Task<IActionResult> UpdatePortfolioItem([FromBody] UpdatePortfolioItemRequestDto req)
        {
            return Ok(await _portfolioService.UpdatePortfolioItemAsync(req));
        }
    }
}

