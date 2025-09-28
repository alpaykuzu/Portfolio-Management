using PortfolioManagement.Core.Dtos.PortfolioDtos;
using PortfolioManagement.Core.Dtos.PortfoloItemDtos;
using PortfolioManagement.Core.Responses;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Core.Interfaces
{
    public interface IPortfolioService
    {
        Task<ApiResponse<List<PortfolioResponseDto>>> GetAllPortfoliosAsync();
        Task<ApiResponse<List<PortfolioResponseDto>>> GetAllPortfoliosAsync(int userId);
        Task<ApiResponse<PortfolioResponseDto>> GetPortfolioAsync(int portfolioId);
        Task<ApiResponse<NoResponse>> AddAssetToPortfolioAsync(CreatePortfolioItemRequestDto req);
        Task NotifyPortfolioUpdateAsync();
        Task NotifyPortfolioUpdateAsync(int userId);
        Task<ApiResponse<NoResponse>> CreatePortfolioAsync(string type);
        Task<ApiResponse<NoResponse>> DeletePortfolioAsync(int portfolioId);
        Task<ApiResponse<NoResponse>> DeletePortfolioItemAsync(int portfolioItemId);
        Task<ApiResponse<NoResponse>> UpdatePortfolioItemAsync(UpdatePortfolioItemRequestDto req);
    }
}
