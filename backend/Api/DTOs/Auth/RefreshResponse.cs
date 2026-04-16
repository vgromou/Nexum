namespace Api.DTOs.Auth;

/// <summary>
/// Response body for successful token refresh.
/// </summary>
public sealed class RefreshResponse
{
    /// <summary>
    /// New JWT access token for API authentication.
    /// </summary>
    /// <example>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c</example>
    public required string AccessToken { get; init; }

    /// <summary>
    /// New refresh token (rotated) for obtaining subsequent access tokens.
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
