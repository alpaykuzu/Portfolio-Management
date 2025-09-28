using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PortfolioManagement.Core.Interfaces;
using PortfolioManagement.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortfolioManagement.Service.Services
{
    public class PriceUpdateService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<PriceUpdateService> _logger;

        public PriceUpdateService(IServiceProvider serviceProvider, ILogger<PriceUpdateService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var portfolioService = scope.ServiceProvider.GetRequiredService<IPortfolioService>();
                    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    // Aktif kullanıcıların portföylerini güncelle
                    var activeUsers = await context.Portfolios
                        .Select(p => p.UserId)
                        .Distinct()
                        .ToListAsync(stoppingToken);

                    foreach (var userId in activeUsers)
                    {
                        await portfolioService.NotifyPortfolioUpdateAsync(userId);
                    }

                    _logger.LogInformation($"Portföy güncellemeleri gönderildi: {activeUsers.Count} kullanıcı");
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Fiyat güncelleme hatası: {ex.Message}");
                }

                // 30 saniyede bir güncelle
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }
    }
}
