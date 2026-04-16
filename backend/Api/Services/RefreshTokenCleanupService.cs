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
    private const int MaxConsecutiveFailures = 5;
    private const int BaseRetryDelaySeconds = 30;

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

        var consecutiveFailures = 0;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredTokensAsync(stoppingToken);
                consecutiveFailures = 0; // Reset on success
            }
            catch (Exception ex)
            {
                consecutiveFailures++;

                if (consecutiveFailures >= MaxConsecutiveFailures)
                {
                    _logger.LogCritical(ex,
                        "Refresh token cleanup has failed {FailureCount} consecutive times. " +
                        "Manual intervention may be required. Continuing with normal interval.",
                        consecutiveFailures);
                    consecutiveFailures = 0; // Reset to continue attempting
                }
                else
                {
                    _logger.LogError(ex,
                        "Error occurred during refresh token cleanup (attempt {FailureCount}/{MaxFailures})",
                        consecutiveFailures, MaxConsecutiveFailures);

                    // Apply exponential backoff: 30s, 60s, 120s, 240s...
                    var retryDelay = TimeSpan.FromSeconds(BaseRetryDelaySeconds * Math.Pow(2, consecutiveFailures - 1));
                    _logger.LogInformation("Retrying cleanup in {RetryDelay} seconds", retryDelay.TotalSeconds);

                    try
                    {
                        await Task.Delay(retryDelay, stoppingToken);
                    }
                    catch (OperationCanceledException)
                    {
                        break;
                    }
                    continue; // Skip the normal interval delay, retry immediately after backoff
                }
            }

            try
            {
                await Task.Delay(_cleanupInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
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
