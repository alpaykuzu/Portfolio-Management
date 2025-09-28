using PortfolioManagement.Core.Dtos.AuthDtos;
using PortfolioManagement.Core.Dtos.TokenDtos;
using PortfolioManagement.Core.Dtos.UserDtos;
using PortfolioManagement.Core.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Core.Interfaces
{
    public interface IAuthService
    {
        Task<ApiResponse<UserResponseDto>> RegisterAsync(RegisterRequestDto registerRequest);
        Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto loginRequestDto);
        Task<ApiResponse<TokensResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto tokenRequest);
        Task<ApiResponse<UserResponseDto>> MeAsync();
    }
}
