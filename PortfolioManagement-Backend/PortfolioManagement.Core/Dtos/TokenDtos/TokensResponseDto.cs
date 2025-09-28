using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Core.Dtos.TokenDtos
{
    public class TokensResponseDto
    {
        public AccessTokenResponseDto AccessToken { get; set; }
        public RefreshTokenResponseDto RefreshToken { get; set; }
    }
}
