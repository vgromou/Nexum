using Api.Common.Errors;

namespace Api.Exceptions;

/// <summary>
/// Exception for rate limiting (HTTP 429).
/// DisplayType: toast - should show auto-dismiss notification.
/// </summary>
public class RateLimitException : ApiException
{
    /// <summary>
    /// Number of seconds until the rate limit resets.
    /// </summary>
    public int? RetryAfterSeconds { get; }

    public RateLimitException(
        string message = "Too many requests. Please try again later",
        int? retryAfterSeconds = null)
        : base(
            statusCode: 429,
            errorCode: ErrorCodes.RATE_LIMIT_EXCEEDED,
            message: message,
            displayType: DisplayType.Toast,
            details: retryAfterSeconds.HasValue
                ? new ApiErrorDetails
                {
                    Context = new Dictionary<string, object>
                    {
                        ["retryAfterSeconds"] = retryAfterSeconds.Value
                    }
                }
                : null)
    {
        RetryAfterSeconds = retryAfterSeconds;
    }

    /// <summary>
    /// Creates a rate limit exception with retry information.
    /// </summary>
    public static RateLimitException TooManyRequests(int retryAfterSeconds)
    {
        return new RateLimitException(
            $"Too many requests. Please try again in {retryAfterSeconds} seconds",
            retryAfterSeconds);
    }

    /// <summary>
    /// Creates a rate limit exception for login attempts.
    /// </summary>
    public static RateLimitException TooManyLoginAttempts(int retryAfterSeconds)
    {
        return new RateLimitException(
            $"Too many login attempts. Please try again in {retryAfterSeconds} seconds",
            retryAfterSeconds);
    }
}
