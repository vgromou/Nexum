using System.ComponentModel.DataAnnotations;

namespace Api.DTOs.Auth;

/// <summary>
/// Request body for refreshing authentication tokens.
/// </summary>
public sealed class RefreshRequest
{
    /// <summary>
    /// The refresh token from a previous login or refresh operation.
    /// </summary>
    /// <example>dGhpcyBpcyBhIHNhbXBsZSByZWZyZXNoIHRva2Vu</example>
    [Required(ErrorMessage = "Refresh token is required")]
    public required string RefreshToken { get; init; }
}
