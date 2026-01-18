using Api.Common.Errors;

namespace Api.Exceptions;

/// <summary>
/// Exception for authentication errors (HTTP 401).
/// Used when user is not authenticated or token is invalid/expired.
/// DisplayType: page - should redirect to login or show session expired page.
/// </summary>
public class UnauthorizedException : ApiException
{
    public UnauthorizedException(
        string message = "Authentication required",
        string errorCode = ErrorCodes.AUTH_TOKEN_INVALID,
        ApiErrorDetails? details = null)
        : base(
            statusCode: 401,
            errorCode: errorCode,
            message: message,
            displayType: DisplayType.Page,
            details: details)
    {
    }

    /// <summary>
    /// Creates an exception for invalid credentials (login/password).
    /// Uses a generic message to avoid revealing whether the login exists.
    /// </summary>
    public static UnauthorizedException InvalidCredentials()
    {
        return new UnauthorizedException(
            "Invalid login or password",
            ErrorCodes.AUTH_INVALID_CREDENTIALS);
    }

    /// <summary>
    /// Creates an exception for expired token.
    /// </summary>
    public static UnauthorizedException TokenExpired()
    {
        return new UnauthorizedException(
            "Your session has expired. Please log in again",
            ErrorCodes.AUTH_TOKEN_EXPIRED);
    }

    /// <summary>
    /// Creates an exception for invalid token.
    /// </summary>
    public static UnauthorizedException TokenInvalid()
    {
        return new UnauthorizedException(
            "Invalid authentication token",
            ErrorCodes.AUTH_TOKEN_INVALID);
    }

    /// <summary>
    /// Creates an exception for expired refresh token.
    /// </summary>
    public static UnauthorizedException RefreshTokenExpired()
    {
        return new UnauthorizedException(
            "Your session has expired. Please log in again",
            ErrorCodes.AUTH_REFRESH_TOKEN_EXPIRED);
    }

    /// <summary>
    /// Creates an exception for locked account with lockout details.
    /// </summary>
    /// <param name="lockoutEndsAt">When the lockout expires.</param>
    /// <param name="remainingMinutes">Minutes remaining until lockout expires.</param>
    public static UnauthorizedException AccountLocked(DateTime lockoutEndsAt, int remainingMinutes)
    {
        var details = new ApiErrorDetails
        {
            Context = new Dictionary<string, object>
            {
                ["lockoutEndsAt"] = lockoutEndsAt,
                ["remainingMinutes"] = remainingMinutes
            }
        };

        return new UnauthorizedException(
            $"Account is locked. Try again in {remainingMinutes} minutes.",
            ErrorCodes.AUTH_ACCOUNT_LOCKED,
            details);
    }

    /// <summary>
    /// Creates an exception for deactivated account.
    /// </summary>
    public static UnauthorizedException AccountDeactivated()
    {
        return new UnauthorizedException(
            "Your account has been deactivated",
            ErrorCodes.AUTH_ACCOUNT_DISABLED);
    }
}
