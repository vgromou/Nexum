using Api.DTOs.Organizations;

namespace Api.DTOs.Auth;

/// <summary>
/// Response body for successful login.
/// </summary>
public sealed class LoginResponse
{
    /// <summary>
    /// JWT access token for API authentication.
    /// </summary>
    /// <example>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c</example>
    public required string AccessToken { get; init; }

    /// <summary>
    /// Refresh token for obtaining new access tokens.
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

    /// <summary>
    /// Authenticated user information.
    /// </summary>
    public required UserInfo User { get; init; }

    /// <summary>
    /// Whether the user must change their password before accessing other endpoints.
    /// </summary>
    /// <example>false</example>
    public required bool MustChangePassword { get; init; }
}
