using PortfolioManagement.Core.Dtos.BISTStockDtos;
using PortfolioManagement.Core.Dtos.CryptoDtos;
using PortfolioManagement.Core.Models;
using PortfolioManagement.Core.Responses;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Core.Interfaces
{
    public interface ISymbolService
    {
        Task<ApiResponse<IEnumerable<BISTStockResponseDto>>> GetAllBISTSymbolAsync();
        Task<ApiResponse<IEnumerable<CryptoAssetResponseDto>>> GetAllCryptoSymbolAsync();
        Task<ApiResponse<IEnumerable<BISTStockResponseDto>>> SearchByBISTSymbolAsync(string symbol);
        Task<ApiResponse<IEnumerable<CryptoAssetResponseDto>>> SearchByCryptoSymbolAsync(string symbol);
    }
}
