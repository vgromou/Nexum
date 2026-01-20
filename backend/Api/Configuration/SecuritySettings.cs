using System.ComponentModel.DataAnnotations;

namespace Api.Configuration;

/// <summary>
/// Configuration settings for security features.
/// </summary>
public sealed class SecuritySettings
{
    /// <summary>
    /// Configuration section name.
    /// </summary>
    public const string SectionName = "Security";

    /// <summary>
    /// Maximum number of failed login attempts before account lockout.
    /// </summary>
    [Range(1, 100)]
    public int MaxFailedLoginAttempts { get; init; } = 5;

    /// <summary>
    /// Account lockout duration in minutes after max failed attempts.
    /// </summary>
    [Range(1, 1440)]
    public int LockoutDurationMinutes { get; init; } = 15;

    /// <summary>
    /// Length of generated temporary passwords.
    /// </summary>
    [Range(8, 64)]
    public int TemporaryPasswordLength { get; init; } = 16;

    /// <summary>
    /// Interval in hours between refresh token cleanup runs.
    /// </summary>
    [Range(1, 168)]
    public int TokenCleanupIntervalHours { get; init; } = 24;

    /// <summary>
    /// Number of days to retain revoked tokens before deletion.
    /// Useful for audit trails and security investigations.
    /// </summary>
    [Range(1, 365)]
    public int RevokedTokenRetentionDays { get; init; } = 30;

    /// <summary>
    /// Maximum number of active refresh token sessions per user.
    /// Set to 0 for unlimited sessions.
    /// </summary>
    [Range(0, 100)]
    public int MaxActiveSessionsPerUser { get; init; } = 10;

    /// <summary>
    /// When true, refresh tokens can only be used from the same IP address
    /// that was used during login. When false (default), IP changes are logged
    /// as warnings but refresh is allowed.
    /// </summary>
    public bool EnforceTokenIpBinding { get; init; } = false;

    /// <summary>
    /// Allowed URL schemes for avatar URLs. Empty list allows all schemes.
    /// Default: ["https"] (only HTTPS allowed).
    /// </summary>
    public List<string> AllowedAvatarUrlSchemes { get; init; } = new() { "https" };

    /// <summary>
    /// Allowed domains for avatar URLs. Empty list allows all domains.
    /// Use this to restrict avatars to specific CDNs or storage services.
    /// Example: ["storage.example.com", "cdn.example.com"]
    /// </summary>
    public List<string> AllowedAvatarUrlDomains { get; init; } = new();
}
