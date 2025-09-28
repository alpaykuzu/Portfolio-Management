using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PortfolioManagement.Core.Dtos.PortfolioDtos;
using PortfolioManagement.Core.Dtos.PortfoloItemDtos;
using PortfolioManagement.Core.Extensions;
using PortfolioManagement.Core.Interfaces;
using PortfolioManagement.Core.Models;
using PortfolioManagement.Core.Repositories;
using PortfolioManagement.Core.Responses;
using PortfolioManagement.Service.Hubs;

namespace PortfolioManagement.Service.Services
{
    public class PortfolioService : IPortfolioService
    {
        private readonly IPriceService _priceService;
        private readonly IGenericRepository<Portfolio> _portfolioRepository;
        private readonly IGenericRepository<PortfolioItem> _portfolioItemRepository;
        private readonly IGenericRepository<BISTStock> _bistStockRepository;
        private readonly IGenericRepository<CryptoAsset> _cryptoAssetRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        private readonly IHubContext<PortfolioHub> _hubContext;
        private readonly ILogger<PortfolioService> _logger;

        public PortfolioService(
            IPriceService priceService,
            IGenericRepository<Portfolio> portfolioRepository,
            IGenericRepository<PortfolioItem> portfolioItemRepository,
            IHubContext<PortfolioHub> hubContext,
            ILogger<PortfolioService> logger,
            IGenericRepository<BISTStock> bistStockRepository,
            IGenericRepository<CryptoAsset> cryptoAssetRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _priceService = priceService;
            _portfolioRepository = portfolioRepository;
            _portfolioItemRepository = portfolioItemRepository;
            _hubContext = hubContext;
            _logger = logger;
            _bistStockRepository = bistStockRepository;
            _cryptoAssetRepository = cryptoAssetRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ApiResponse<List<PortfolioResponseDto>>> GetAllPortfoliosAsync()
        {
            var userId = _httpContextAccessor.HttpContext.User.GetUserId();
            var portfolios = await _portfolioRepository.Query()
                .Include(p => p.Items)
                .Where(p => p.UserId == userId)
                .ToListAsync();

            if (!portfolios.Any())
            {
                return ApiResponse<List<PortfolioResponseDto>>.Fail("Portföy bulunamadı");
            }

            var portfolioDtos = new List<PortfolioResponseDto>();
            foreach (var portfolio in portfolios)
            {
                var itemsDto = new List<PortfoloItemResponseDto>();
                decimal totalValue = 0;
                decimal totalInvestment = 0;
                foreach (var item in portfolio.Items)
                {
                    var priceResponse = await _priceService.GetPriceAsync(item.Symbol, item.Type);
                    if (!priceResponse.Success || priceResponse.Data == null)
                    {
                        _logger.LogWarning($"Price not found for symbol: {item.Symbol}");
                        continue;
                    }

                    var currentPrice = decimal.Parse(priceResponse.Data.Replace(".", ","));
                    var currentValue = currentPrice * item.Quantity;
                    var investment = item.BuyPrice * item.Quantity;
                    var profit = currentValue - investment;
                    var profitPercentage = investment > 0 ? (profit / investment) * 100 : 0;

                    itemsDto.Add(new PortfoloItemResponseDto
                    {
                        Id = item.Id,
                        Symbol = item.Symbol,
                        Quantity = item.Quantity,
                        BuyPrice = item.BuyPrice,
                        CurrentPrice = currentPrice,
                        TotalValue = currentValue,
                        Profit = profit,
                        ProfitPercentage = profitPercentage
                    });

                    totalValue += currentValue;
                    totalInvestment += investment;
                }

                var totalProfit = totalValue - totalInvestment;
                var totalProfitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

                var dto = new PortfolioResponseDto
                {
                    Id = portfolio.Id,
                    Type = portfolio.Type,
                    TotalValue = totalValue,
                    TotalInvestment = totalInvestment,
                    TotalProfit = totalProfit,
                    ProfitPercentage = totalProfitPercentage,
                    Items = itemsDto
                };
                portfolioDtos.Add(dto);
            }

            return ApiResponse<List<PortfolioResponseDto>>.Ok(portfolioDtos);
        }

        public async Task<ApiResponse<PortfolioResponseDto>> GetPortfolioAsync(int portfolioId)
        {
            var userId = _httpContextAccessor.HttpContext.User.GetUserId();
            var portfolio = await _portfolioRepository.Query()
                .Include(p => p.Items)
                .FirstOrDefaultAsync(p => p.Id == portfolioId);

            if (portfolio == null)
            {
                return ApiResponse<PortfolioResponseDto>.Fail("Portföy bulunamadı");
            }
            var itemsDto = new List<PortfoloItemResponseDto>();
            decimal totalValue = 0;
            decimal totalInvestment = 0;

            foreach (var item in portfolio.Items)
            {
                var priceResponse = await _priceService.GetPriceAsync(item.Symbol, item.Type);

                if (!priceResponse.Success || priceResponse.Data == null)
                {
                    _logger.LogWarning($"Price not found for symbol: {item.Symbol}");
                    continue;
                }

                var currentPrice = decimal.Parse(priceResponse.Data.Replace(".", ","));

                var currentValue = currentPrice * item.Quantity;
                var investment = item.BuyPrice * item.Quantity;
                var profit = currentValue - investment;
                var profitPercentage = investment > 0 ? (profit / investment) * 100 : 0;

                itemsDto.Add(new PortfoloItemResponseDto
                {
                    Id = item.Id,
                    Symbol = item.Symbol,
                    Quantity = item.Quantity,
                    BuyPrice = item.BuyPrice,
                    CurrentPrice = currentPrice,
                    TotalValue = currentValue,
                    Profit = profit,
                    ProfitPercentage = profitPercentage,
                    PurchaseDate = item.PurchaseDate
                });

                totalValue += currentValue;
                totalInvestment += investment;
            }

            var totalProfit = totalValue - totalInvestment;
            var totalProfitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

            var dto = new PortfolioResponseDto
            {
                Id = portfolio.Id,
                Type = portfolio.Type,  
                TotalValue = totalValue,
                TotalInvestment = totalInvestment,
                TotalProfit = totalProfit,
                ProfitPercentage = totalProfitPercentage,
                Items = itemsDto
            };            

            return ApiResponse<PortfolioResponseDto>.Ok(dto);
        }
        public async Task<ApiResponse<NoResponse>> AddAssetToPortfolioAsync(CreatePortfolioItemRequestDto req)
        {
            try
            {
                var portfolio = await _portfolioRepository.Query()
                .Include(p => p.Items)
                .FirstOrDefaultAsync(p => p.Id == req.PortfolioId);

                if (portfolio == null)
                    return ApiResponse<NoResponse>.Fail("Portfolyo bulunamadı.");

                if (req.Quantity <= 0 || req.BuyPrice <= 0)
                {
                    _logger.LogWarning("Miktar veya alış fiyatı sıfır veya negatif olamaz.");
                    return ApiResponse<NoResponse>.Fail("Miktar veya alış fiyatı sıfır veya negatif olamaz.");
                }
                if (portfolio.Type == "stock")
                {
                    var stock = await _bistStockRepository.GetFirstOrDefaultAsync(s => s.Symbol == req.Symbol.ToUpper());
                    if (stock == null)
                    {
                        _logger.LogWarning($"BIST hisse senedi bulunamadı: {req.Symbol}");
                        return ApiResponse<NoResponse>.Fail($"BIST hisse senedi bulunamadı: {req.Symbol}");
                    }
                }
                else if (portfolio.Type == "crypto")
                {
                    var crypto = await _cryptoAssetRepository.GetFirstOrDefaultAsync(c => c.Symbol == req.Symbol.ToUpper());
                    if (crypto == null)
                    {
                        _logger.LogWarning($"Kripto varlık bulunamadı: {req.Symbol}");
                        return ApiResponse<NoResponse>.Fail($"Kripto varlık bulunamadı: {req.Symbol}");
                    }
                }
                else
                {
                    _logger.LogWarning($"Geçersiz varlık türü: {req.Symbol}");
                    return ApiResponse<NoResponse>.Fail($"Geçersiz varlık türü: {req.Symbol}");
                }
            

                var portfolioItem = new PortfolioItem
                {
                    PortfolioId = req.PortfolioId,
                    Symbol = req.Symbol,
                    Type = portfolio.Type,
                    Quantity = req.Quantity,
                    BuyPrice = req.BuyPrice,
                    CreatedAt = DateTime.UtcNow,
                    PurchaseDate = req.PurchaseDate
                };

                await _portfolioItemRepository.AddAsync(portfolioItem);

                // SignalR ile bildirim gönder
                await NotifyPortfolioUpdateAsync();

                return ApiResponse<NoResponse>.Ok("Başarılı");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Portföye varlık eklenemedi: {ex.Message}");
                return ApiResponse<NoResponse>.Fail($"Portföye varlık eklenemedi: {ex.Message}");
            }
        }

        public async Task<ApiResponse<NoResponse>> CreatePortfolioAsync(string type)
        {
            var userId = _httpContextAccessor.HttpContext.User.GetUserId();
            if(type !="stock" && type != "crypto")
                return ApiResponse<NoResponse>.Fail("Type invalid.");
            var newPortfolio = new Portfolio
            {
                UserId = userId,
                Type = type
            };
            await _portfolioRepository.AddAsync(newPortfolio);
            // SignalR ile bildirim gönder
            await NotifyPortfolioUpdateAsync();
            return ApiResponse<NoResponse>.Ok("Portfolio created.");
        }
        public async Task<ApiResponse<NoResponse>> DeletePortfolioAsync(int portfolioId)
        {
            var portfolio = await _portfolioRepository.GetByIdAsync(portfolioId);
            if (portfolio == null)
                return ApiResponse<NoResponse>.Fail("Portfolio not found.");
            await _portfolioRepository.DeleteAsync(portfolio);
            // SignalR ile bildirim gönder
            await NotifyPortfolioUpdateAsync();
            return ApiResponse<NoResponse>.Ok("Portfolio deleted.");
        }
        public async Task<ApiResponse<NoResponse>> DeletePortfolioItemAsync(int portfolioItemId)
        {
            var portfolio = await _portfolioItemRepository.GetByIdAsync(portfolioItemId);
            if (portfolio == null)
                return ApiResponse<NoResponse>.Fail("Portfolio Item not found.");
            await _portfolioItemRepository.DeleteAsync(portfolio);
            // SignalR ile bildirim gönder
            await NotifyPortfolioUpdateAsync();
            return ApiResponse<NoResponse>.Ok("Portfolio Item deleted.");
        }
        public async Task<ApiResponse<NoResponse>> UpdatePortfolioItemAsync(UpdatePortfolioItemRequestDto req)
        {
            var userId = _httpContextAccessor.HttpContext.User.GetUserId();
            var portfolioItem = await _portfolioItemRepository.GetByIdAsync(req.PortfolioId);
            if (portfolioItem == null)
                return ApiResponse<NoResponse>.Fail("Portfolio not found.");
            portfolioItem.BuyPrice = req.BuyPrice;
            portfolioItem.Quantity = req.Quantity;
            await _portfolioItemRepository.UpdateAsync(portfolioItem);
            // SignalR ile bildirim gönder
            await NotifyPortfolioUpdateAsync();
            return ApiResponse<NoResponse>.Ok("Portfolio deleted.");
        }
        public async Task NotifyPortfolioUpdateAsync()
        {
            var userId = _httpContextAccessor.HttpContext.User.GetUserId();
            var portfolio = await GetAllPortfoliosAsync();
            await _hubContext.Clients.Group($"User_{userId}").SendAsync("update", portfolio);
        }





        // Kullanıcı ID'sine göre tüm portföyleri getir
        public async Task<ApiResponse<List<PortfolioResponseDto>>> GetAllPortfoliosAsync(int userId)
        {
            var portfolios = await _portfolioRepository.Query()
                .Include(p => p.Items)
                .Where(p => p.UserId == userId)
                .ToListAsync();

            if (!portfolios.Any())
            {
                return ApiResponse<List<PortfolioResponseDto>>.Fail("Portföy bulunamadı");
            }

            var portfolioDtos = new List<PortfolioResponseDto>();
            foreach (var portfolio in portfolios)
            {
                var itemsDto = new List<PortfoloItemResponseDto>();
                decimal totalValue = 0;
                decimal totalInvestment = 0;
                foreach (var item in portfolio.Items)
                {
                    var priceResponse = await _priceService.GetPriceAsync(item.Symbol, item.Type);
                    if (!priceResponse.Success || priceResponse.Data == null)
                    {
                        _logger.LogWarning($"Price not found for symbol: {item.Symbol}");
                        continue;
                    }
                    var currentPrice = decimal.Parse(priceResponse.Data.Replace(".", ","));
                    var currentValue = currentPrice * item.Quantity;
                    var investment = item.BuyPrice * item.Quantity;
                    var profit = currentValue - investment;
                    var profitPercentage = investment > 0 ? (profit / investment) * 100 : 0;

                    itemsDto.Add(new PortfoloItemResponseDto
                    {
                        Id = item.Id,
                        Symbol = item.Symbol,
                        Quantity = item.Quantity,
                        BuyPrice = item.BuyPrice,
                        CurrentPrice = currentPrice,
                        TotalValue = currentValue,
                        Profit = profit,
                        ProfitPercentage = profitPercentage
                    });

                    totalValue += currentValue;
                    totalInvestment += investment;
                }

                var totalProfit = totalValue - totalInvestment;
                var totalProfitPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

                var dto = new PortfolioResponseDto
                {
                    Id = portfolio.Id,
                    Type = portfolio.Type,
                    TotalValue = totalValue,
                    TotalInvestment = totalInvestment,
                    TotalProfit = totalProfit,
                    ProfitPercentage = totalProfitPercentage,
                    Items = itemsDto
                };
                portfolioDtos.Add(dto);
            }

            return ApiResponse<List<PortfolioResponseDto>>.Ok(portfolioDtos);
        }

        // Kullanıcı ID'sine göre bildirim gönder
        public async Task NotifyPortfolioUpdateAsync(int userId)
        {
            var portfolio = await GetAllPortfoliosAsync(userId);
            await _hubContext.Clients.Group($"User_{userId}").SendAsync("update", portfolio);
        }
    }
}
