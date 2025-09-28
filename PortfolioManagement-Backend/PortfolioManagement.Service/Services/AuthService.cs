using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using PortfolioManagement.Core.Dtos.AuthDtos;
using PortfolioManagement.Core.Dtos.TokenDtos;
using PortfolioManagement.Core.Dtos.UserDtos;
using PortfolioManagement.Core.Extensions;
using PortfolioManagement.Core.Interfaces;
using PortfolioManagement.Core.Models;
using PortfolioManagement.Core.Repositories;
using PortfolioManagement.Core.Responses;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Service.Services
{
    public class AuthService : IAuthService
    {
        private readonly IGenericRepository<User> _userRepository;
        private readonly IGenericRepository<RefreshToken> _refreshTokenRepository;
        private readonly ITokenService _tokenService;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthService(IGenericRepository<User> userRepository, IGenericRepository<RefreshToken> refreshTokenRepository, ITokenService tokenService, IMapper mapper, IHttpContextAccessor httpContextAccessor)
        {
            _userRepository = userRepository;
            _refreshTokenRepository = refreshTokenRepository;
            _tokenService = tokenService;
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto loginRequestDto)
        {
            var user = await _userRepository.GetFirstOrDefaultAsync(u => u.Email == loginRequestDto.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(loginRequestDto.Password, user.PasswordHash))
                return ApiResponse<LoginResponseDto>.Fail("Giriş başarısız");


            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Name, user.FirstName + " " + user.LastName),
                new(ClaimTypes.Email, user.Email)
            };
            var accessTokenDto = _tokenService.GenerateToken(claims);
            var refreshTokenDto = _tokenService.GenerateRefreshToken();

            var existingToken = await _refreshTokenRepository.GetFirstOrDefaultAsync(x => x.UserId == user.Id);
            if (existingToken != null)
            {
                existingToken.Token = refreshTokenDto.RefreshToken;
                existingToken.ExpirationDate = refreshTokenDto.RefreshTokenExpTime;
                await _refreshTokenRepository.UpdateAsync(existingToken);
            }
            else
            {
                var refreshToken = new RefreshToken
                {
                    Token = refreshTokenDto.RefreshToken,
                    ExpirationDate = refreshTokenDto.RefreshTokenExpTime,
                    UserId = user.Id
                };
                await _refreshTokenRepository.AddAsync(refreshToken);
            }

            var userResponse = _mapper.Map<User, UserResponseDto>(user);

            var loginResponse = new LoginResponseDto
            {
                UserInfo = userResponse,
                AccessToken = accessTokenDto,
                RefreshToken = refreshTokenDto
            };
            return ApiResponse<LoginResponseDto>.Ok(loginResponse, "Giriş başarılı");
        }

        public async Task<ApiResponse<UserResponseDto>> MeAsync()
        {
            var userId = _httpContextAccessor.HttpContext.User.GetUserId();
            var user = await _userRepository.Query()
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return ApiResponse<UserResponseDto>.Fail("Kullanıcı bulunamadı");
            var userResponse = _mapper.Map<User, UserResponseDto>(user);
            return ApiResponse<UserResponseDto>.Ok(userResponse, "Kullanıcı bilgisi getirildi");
        }


        public async Task<ApiResponse<TokensResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto tokenRequest)
        {
            var existingToken = await _refreshTokenRepository.Query()
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.Token == tokenRequest.RefreshToken);

            if (existingToken == null || existingToken.ExpirationDate < DateTime.UtcNow)
            {
                return ApiResponse<TokensResponseDto>.Fail("Geçersiz veya tarihi geçmiş token!");
            }
            var claims = new List<Claim>
            {
                new (ClaimTypes.NameIdentifier, existingToken.User.Id.ToString()),
                new (ClaimTypes.Name, existingToken.User.FirstName + " " + existingToken.User.LastName),
                new (ClaimTypes.Email, existingToken.User.Email)
            };
            var newGeneratedTokenDto = _tokenService.GenerateToken(claims);
            var newGeneratedRefreshTokenDto = _tokenService.GenerateRefreshToken();

            existingToken.Token = newGeneratedRefreshTokenDto.RefreshToken;
            existingToken.ExpirationDate = newGeneratedRefreshTokenDto.RefreshTokenExpTime;
            await _refreshTokenRepository.UpdateAsync(existingToken);

            var tokensResponse = new TokensResponseDto
            {
                AccessToken = newGeneratedTokenDto,
                RefreshToken = newGeneratedRefreshTokenDto,
            };
            return ApiResponse<TokensResponseDto>.Ok(tokensResponse, "Token güncellendi");
        }

        public async Task<ApiResponse<UserResponseDto>> RegisterAsync(RegisterRequestDto registerRequest)
        {
            if (await _userRepository.GetFirstOrDefaultAsync(u => u.Email == registerRequest.Email) != null)
                return ApiResponse<UserResponseDto>.Fail("Zaten kayıtlı hesap!");

            var user = _mapper.Map<RegisterRequestDto, User>(registerRequest, opt =>
            {
                opt.Items["PasswordHash"] = BCrypt.Net.BCrypt.HashPassword(registerRequest.Password);
            });
            await _userRepository.AddAsync(user);

            var userDto = _mapper.Map<UserResponseDto>(user);
            return ApiResponse<UserResponseDto>.Ok(userDto, "Kayıt başarılı");
        }
    }
}
