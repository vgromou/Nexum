using System.Net;

namespace Api.Models;

/// <summary>
/// Login attempt tracking for brute-force protection
/// Tracks attempts for both existing and non-existing accounts
/// </summary>
public class LoginAttempt : BaseEntity
{
    /// <summary>
    /// Login identifier used in the attempt (email or username)
    /// </summary>
    public string LoginIdentifier { get; set; } = string.Empty;

    /// <summary>
    /// IP address of the client
    /// </summary>
    public IPAddress? IpAddress { get; set; }

    /// <summary>
    /// Whether the login was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Reason for failure (invalid_password, user_not_found, account_locked, etc.)
    /// </summary>
    public string? FailureReason { get; set; }

    /// <summary>
    /// Browser/device user agent string
    /// </summary>
    public string? UserAgent { get; set; }

    // Note: CreatedAt from BaseEntity serves as attempt timestamp
}
