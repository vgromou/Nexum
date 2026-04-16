using System.ComponentModel.DataAnnotations;

namespace Api.DTOs.Auth;

/// <summary>
/// Request body for user logout.
/// </summary>
public sealed class LogoutRequest
{
    /// <summary>
    /// The refresh token to revoke.
    /// </summary>
    /// <example>dGhpcyBpcyBhIHNhbXBsZSByZWZyZXNoIHRva2Vu</example>
    [Required(ErrorMessage = "Refresh token is required")]
    public required string RefreshToken { get; init; }
}
