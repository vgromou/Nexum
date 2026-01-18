using Api.Common.Errors;

namespace Api.Exceptions;

/// <summary>
/// Exception for server errors (HTTP 500).
/// Used for unexpected internal errors.
/// DisplayType: toast - should show auto-dismiss notification.
/// </summary>
public class ServerException : ApiException
{
    public ServerException(
        string message = "An unexpected error occurred",
        string errorCode = ErrorCodes.SERVER_ERROR,
        Exception? innerException = null)
        : base(
            statusCode: 500,
            errorCode: errorCode,
            message: message,
            displayType: DisplayType.Toast,
            innerException: innerException)
    {
    }

    /// <summary>
    /// Creates an exception for service unavailable.
    /// </summary>
    public static ServerException ServiceUnavailable(string? serviceName = null)
    {
        var message = serviceName != null
            ? $"The {serviceName} service is temporarily unavailable. Please try again later"
            : "The service is temporarily unavailable. Please try again later";

        return new ServerException(message, ErrorCodes.SERVER_UNAVAILABLE);
    }

    /// <summary>
    /// Creates an exception for timeout.
    /// </summary>
    public static ServerException Timeout(string? operation = null)
    {
        var message = operation != null
            ? $"The {operation} operation timed out. Please try again"
            : "The operation timed out. Please try again";

        return new ServerException(message, ErrorCodes.SERVER_TIMEOUT);
    }

    /// <summary>
    /// Creates an exception for external service failure.
    /// </summary>
    public static ServerException ExternalServiceError(string serviceName, Exception? innerException = null)
    {
        return new ServerException(
            $"An error occurred while communicating with {serviceName}",
            ErrorCodes.SERVER_EXTERNAL_SERVICE_ERROR,
            innerException);
    }
}
