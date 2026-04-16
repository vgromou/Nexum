namespace Api.DTOs.Auth;

/// <summary>
/// Response body for successful password change.
/// Contains new tokens with updated must_change_password claim.
/// </summary>
public sealed class ChangePasswordResponse
{
    /// <summary>
    /// New JWT access token with must_change_password=false.
    /// </summary>
    /// <example>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</example>
    public required string AccessToken { get; init; }

    /// <summary>
    /// New refresh token for obtaining subsequent access tokens.
    /// </summary>
    /// <example>dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4gZXhhbXBsZQ==</example>
    public required string RefreshToken { get; init; }

    /// <summary>
    /// Access token expiration time in seconds.
    /// </summary>
    /// <example>900</example>
    public required int ExpiresIn { get; init; }

    /// <summary>
    /// Token type (always "Bearer").
    /// </summary>
    /// <example>Bearer</example>
    public string TokenType => "Bearer";
}
