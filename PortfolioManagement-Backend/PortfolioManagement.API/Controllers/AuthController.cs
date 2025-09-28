using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PortfolioManagement.Core.Dtos.AuthDtos;
using PortfolioManagement.Core.Dtos.TokenDtos;
using PortfolioManagement.Core.Interfaces;

namespace PortfolioManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto req)
        {
            return Ok(await _authService.RegisterAsync(req));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto req)
        {
            return Ok(await _authService.LoginAsync(req));
        }
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            return Ok(await _authService.MeAsync());
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto req)
        {
            return Ok(await _authService.RefreshTokenAsync(req));
        }
    }
}
