using Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Api.Configuration;

namespace Api.Services;

/// <summary>
/// Background service that periodically cleans up expired and revoked refresh tokens.
/// </summary>
public sealed class RefreshTokenCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RefreshTokenCleanupService> _logger;
    private readonly TimeSpan _cleanupInterval;
    private readonly int _retentionDays;

    public RefreshTokenCleanupService(
        IServiceScopeFactory scopeFactory,
        ILogger<RefreshTokenCleanupService> logger,
        IOptions<SecuritySettings> securitySettings)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _cleanupInterval = TimeSpan.FromHours(securitySettings.Value.TokenCleanupIntervalHours);
        _retentionDays = securitySettings.Value.RevokedTokenRetentionDays;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "Refresh token cleanup service started. Cleanup interval: {Interval}h, Retention: {Retention} days",
            _cleanupInterval.TotalHours, _retentionDays);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredTokensAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during refresh token cleanup");
            }

            await Task.Delay(_cleanupInterval, stoppingToken);
        }
    }

    private async Task CleanupExpiredTokensAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var timeProvider = scope.ServiceProvider.GetRequiredService<TimeProvider>();

        var now = timeProvider.GetUtcNow().UtcDateTime;
        var retentionCutoff = now.AddDays(-_retentionDays);

        // Delete tokens that are:
        // 1. Expired (past their expiration date)
        // 2. Revoked and older than retention period
        var deletedCount = await context.RefreshTokens
            .Where(t => t.ExpiresAt < now || (t.RevokedAt != null && t.RevokedAt < retentionCutoff))
            .ExecuteDeleteAsync(cancellationToken);

        if (deletedCount > 0)
        {
            _logger.LogInformation("Cleaned up {Count} expired/revoked refresh tokens", deletedCount);
        }
    }
}
