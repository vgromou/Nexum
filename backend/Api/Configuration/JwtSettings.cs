using System.ComponentModel.DataAnnotations;

namespace Api.Configuration;

/// <summary>
/// Configuration settings for JWT authentication.
/// </summary>
public sealed class JwtSettings
{
    /// <summary>
    /// Configuration section name.
    /// </summary>
    public const string SectionName = "Jwt";

    /// <summary>
    /// Secret key for signing tokens. Must be at least 256 bits (32 characters).
    /// </summary>
    [Required]
    [MinLength(32)]
    public required string Secret { get; init; }

    /// <summary>
    /// Token issuer (iss claim).
    /// </summary>
    [Required]
    public required string Issuer { get; init; }

    /// <summary>
    /// Token audience (aud claim).
    /// </summary>
    [Required]
    public required string Audience { get; init; }

    /// <summary>
    /// Access token expiration time in minutes.
    /// </summary>
    [Range(1, 60)]
    public int AccessTokenExpirationMinutes { get; init; } = 15;

    /// <summary>
    /// Refresh token expiration time in days.
    /// </summary>
    [Range(1, 30)]
    public int RefreshTokenExpirationDays { get; init; } = 7;
}
