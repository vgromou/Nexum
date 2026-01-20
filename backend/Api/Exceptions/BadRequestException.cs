using Api.Common.Errors;

namespace Api.Exceptions;

/// <summary>
/// Exception for bad request errors (HTTP 400).
/// Used when the request itself is malformed or contains invalid data.
/// DisplayType: toast - should show as a notification.
/// </summary>
public class BadRequestException : ApiException
{
    public BadRequestException(
        string message,
        string errorCode = ErrorCodes.BAD_REQUEST)
        : base(
            statusCode: 400,
            errorCode: errorCode,
            message: message,
            displayType: DisplayType.Toast)
    {
    }

    /// <summary>
    /// Creates an exception for invalid input data.
    /// </summary>
    public static BadRequestException InvalidInput(string reason)
    {
        return new BadRequestException(reason, ErrorCodes.INVALID_INPUT);
    }
}
