using System.ComponentModel.DataAnnotations;

namespace Api.DTOs.Auth;

/// <summary>
/// Request body for user login.
/// </summary>
public sealed class LoginRequest
{
    /// <summary>
    /// User's email address or username.
    /// </summary>
    /// <example>john.smith@company.com</example>
    [Required(ErrorMessage = "Login is required")]
    [StringLength(256, MinimumLength = 1, ErrorMessage = "Login must be between 1 and 256 characters")]
    public required string Login { get; init; }

    /// <summary>
    /// User's password.
    /// </summary>
    /// <example>SecureP@ssword123</example>
    [Required(ErrorMessage = "Password is required")]
    [StringLength(128, MinimumLength = 1, ErrorMessage = "Password must be between 1 and 128 characters")]
    public required string Password { get; init; }
}
