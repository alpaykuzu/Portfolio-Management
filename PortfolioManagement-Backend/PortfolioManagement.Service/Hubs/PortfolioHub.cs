using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using PortfolioManagement.Core.Extensions;
using System.Security.Claims;

namespace PortfolioManagement.Service.Hubs
{
    [Authorize]
    public class PortfolioHub : Hub
    {
        private readonly ILogger<PortfolioHub> _logger;

        public PortfolioHub(ILogger<PortfolioHub> logger)
        {
            _logger = logger;
        }

        public async Task JoinUserGroup()
        {
            try
            {
                var userId = Context.User.GetUserId();
                await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
                _logger.LogInformation($"User {userId} joined their group with connection {Context.ConnectionId}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error joining user group: {ex.Message}");
            }
        }

        public async Task LeaveUserGroup()
        {
            try
            {
                var userId = Context.User.GetUserId();
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
                _logger.LogInformation($"User {userId} left their group");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error leaving user group: {ex.Message}");
            }
        }

        public override async Task OnConnectedAsync()
        {
            try
            {
                var userId = Context.User.GetUserId();
                _logger.LogInformation($"Client connected: {Context.ConnectionId}, User: {userId}");

                // Automatically join user to their group on connection
                await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
                _logger.LogInformation($"User {userId} automatically joined their group");

                await base.OnConnectedAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error on client connection: {ex.Message}");
                await base.OnConnectedAsync();
            }
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            try
            {
                var userId = Context.User?.GetUserId();
                _logger.LogInformation($"Client disconnected: {Context.ConnectionId}, User: {userId}, Exception: {exception?.Message}");

                if (userId.HasValue)
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
                    _logger.LogInformation($"User {userId} automatically removed from their group");
                }

                await base.OnDisconnectedAsync(exception);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error on client disconnection: {ex.Message}");
                await base.OnDisconnectedAsync(exception);
            }
        }

        // Add a ping method to keep connection alive
        public async Task Ping()
        {
            try
            {
                await Clients.Caller.SendAsync("Pong");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in Ping: {ex.Message}");
            }
        }
    }
}