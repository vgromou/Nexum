using System.Net;

namespace Api.Models;

/// <summary>
/// Refresh token for JWT session management
/// Allows multiple active sessions per user (laptop, phone, tablet)
/// </summary>
public class RefreshToken : AuditableEntity
{
    /// <summary>
    /// User who owns this token
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// SHA-256 hash of the actual token (security: raw token never stored)
    /// </summary>
    public string TokenHash { get; set; } = string.Empty;

    /// <summary>
    /// Token expiration timestamp
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// When the token was revoked (null if still valid)
    /// </summary>
    public DateTime? RevokedAt { get; set; }

    /// <summary>
    /// Reason for revocation (logout, security, password_change, etc.)
    /// </summary>
    public string? RevokedReason { get; set; }

    /// <summary>
    /// Device/browser information for session management
    /// </summary>
    public string? DeviceInfo { get; set; }

    /// <summary>
    /// IP address from which the token was created
    /// </summary>
    public IPAddress? IpAddress { get; set; }

    // Navigation properties

    /// <summary>
    /// User who owns this token
    /// </summary>
    public User User { get; set; } = null!;

    // Helper methods

    /// <summary>
    /// Whether the token is currently valid (not expired and not revoked)
    /// </summary>
    public bool IsValid => IsValidAt(DateTime.UtcNow);

    /// <summary>
    /// Whether the token is valid at the specified time (for testability)
    /// </summary>
    public bool IsValidAt(DateTime utcNow) => RevokedAt == null && ExpiresAt > utcNow;
}
