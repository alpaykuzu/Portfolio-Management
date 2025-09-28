using Microsoft.EntityFrameworkCore;
using PortfolioManagement.Core.Dtos.BISTStockDtos;
using PortfolioManagement.Core.Dtos.CryptoDtos;
using PortfolioManagement.Core.Interfaces;
using PortfolioManagement.Core.Models;
using PortfolioManagement.Core.Repositories;
using PortfolioManagement.Core.Responses;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace PortfolioManagement.Service.Services
{
    public class SymbolService : ISymbolService
    {
        private readonly IGenericRepository<BISTStock> _stockRepository;
        private readonly IGenericRepository<CryptoAsset> _cryptoRepository;

        public SymbolService(IGenericRepository<BISTStock> stockRepository, IGenericRepository<CryptoAsset> cryptoRepository)
        {
            _stockRepository = stockRepository;
            _cryptoRepository = cryptoRepository;
        }

        public async Task<ApiResponse<IEnumerable<BISTStockResponseDto>>> GetAllBISTSymbolAsync()
        {
            var stocks = await _stockRepository.GetAllAsync();
            var stockDtos = stocks.Select(s => new BISTStockResponseDto
            {
                Id = s.Id,
                Symbol = s.Symbol,
                Name = s.Name,
                LogoUrl = s.LogoUrl
            }).ToList();
            return ApiResponse<IEnumerable<BISTStockResponseDto>>.Ok(stockDtos, "Success");
        }
        public async Task<ApiResponse<IEnumerable<CryptoAssetResponseDto>>> GetAllCryptoSymbolAsync()
        {
            var assets = await _cryptoRepository.GetAllAsync();
            var cryptoDtos = assets.Select(s => new CryptoAssetResponseDto
            {
                Id = s.Id,
                Symbol = s.Symbol,
                DisplaySymbol = s.DisplaySymbol
            }).ToList();
            return ApiResponse<IEnumerable<CryptoAssetResponseDto>>.Ok(cryptoDtos, "Success");
        }

        public async Task<ApiResponse<IEnumerable<BISTStockResponseDto>>> SearchByBISTSymbolAsync(string symbol)
        {
            var stocks = await _stockRepository.Query().Where(s => s.Symbol.Contains(symbol.ToUpper())).ToListAsync();
            if (stocks == null) return ApiResponse<IEnumerable<BISTStockResponseDto>>.Fail("Not Found"); 
            var stockDtos = stocks.Select(s => new BISTStockResponseDto
            {
                Id = s.Id,
                Symbol = s.Symbol,
                Name = s.Name,
                LogoUrl = s.LogoUrl
            }).ToList();
            return ApiResponse<IEnumerable<BISTStockResponseDto>>.Ok(stockDtos, "Success");
        }
        public async Task<ApiResponse<IEnumerable<CryptoAssetResponseDto>>> SearchByCryptoSymbolAsync(string symbol)
        {
            var assets = await _cryptoRepository.Query().Where(s => s.Symbol.Contains(symbol.ToUpper())).ToListAsync();
            if (assets == null) return ApiResponse<IEnumerable<CryptoAssetResponseDto>>.Fail("Not Found");
            var cryptoDtos = assets.Select(s => new CryptoAssetResponseDto
            {
                Id = s.Id,
                Symbol = s.Symbol,
                DisplaySymbol = s.DisplaySymbol
            }).ToList();
            return ApiResponse<IEnumerable<CryptoAssetResponseDto>>.Ok(cryptoDtos, "Success");
        }
    }
}
