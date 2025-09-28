using PortfolioManagement.Core.Dtos.TokenDtos;
using PortfolioManagement.Core.Dtos.UserDtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Core.Dtos.AuthDtos
{
    public class LoginResponseDto
    {
        public UserResponseDto UserInfo { get; set; }
        public AccessTokenResponseDto AccessToken { get; set; }
        public RefreshTokenResponseDto RefreshToken { get; set; }
    }
}
