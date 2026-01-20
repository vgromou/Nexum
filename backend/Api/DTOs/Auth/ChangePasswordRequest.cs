using System.ComponentModel.DataAnnotations;

namespace Api.DTOs.Auth;

/// <summary>
/// Request body for changing user password.
/// </summary>
public sealed class ChangePasswordRequest
{
    /// <summary>
    /// Current password for verification.
    /// </summary>
    /// <example>OldP@ssword123</example>
    [Required(ErrorMessage = "Current password is required")]
    [StringLength(128, MinimumLength = 1, ErrorMessage = "Current password must be between 1 and 128 characters")]
    public required string CurrentPassword { get; init; }

    /// <summary>
    /// New password to set.
    /// </summary>
    /// <example>NewSecureP@ssword456</example>
    [Required(ErrorMessage = "New password is required")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "New password must be between 8 and 128 characters")]
    public required string NewPassword { get; init; }
}
