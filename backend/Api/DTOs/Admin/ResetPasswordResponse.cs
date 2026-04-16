namespace Api.DTOs.Admin;

/// <summary>
/// Response body after successfully resetting a user's password.
/// </summary>
public sealed class ResetPasswordResponse
{
    /// <summary>
    /// The ID of the user whose password was reset.
    /// </summary>
    /// <example>550e8400-e29b-41d4-a716-446655440001</example>
    public required Guid UserId { get; init; }

    /// <summary>
    /// The auto-generated temporary password.
    /// This is shown only once and should be securely shared with the user.
    /// </summary>
    /// <example>Yj7&amp;nQ4!wK9@pT3x</example>
    public required string TemporaryPassword { get; init; }

    /// <summary>
    /// Success message with instructions.
    /// </summary>
    /// <example>Password reset successfully. User must change password on next login.</example>
    public string Message { get; init; } = "Password reset successfully. User must change password on next login.";
}
