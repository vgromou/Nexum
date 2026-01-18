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
}
