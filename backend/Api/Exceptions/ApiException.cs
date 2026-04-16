using Api.Common.Errors;

namespace Api.Exceptions;

/// <summary>
/// Base exception class for all API errors.
/// All custom exceptions should inherit from this class.
/// </summary>
public class ApiException : Exception
{
    /// <summary>
    /// HTTP status code to return.
    /// </summary>
    public int StatusCode { get; }

    /// <summary>
    /// Machine-readable error code.
    /// </summary>
    public string ErrorCode { get; }

    /// <summary>
    /// How the frontend should display this error.
    /// </summary>
    public DisplayType DisplayType { get; }

    /// <summary>
    /// Optional additional details about the error.
    /// </summary>
    public ApiErrorDetails? Details { get; }

    public ApiException(
        int statusCode,
        string errorCode,
        string message,
        DisplayType displayType = DisplayType.Toast,
        ApiErrorDetails? details = null,
        Exception? innerException = null)
        : base(message, innerException)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
        DisplayType = displayType;
        Details = details;
    }

    /// <summary>
    /// Converts this exception to an ApiError object.
    /// </summary>
    public ApiError ToApiError(string traceId, DateTime timestamp)
    {
        return new ApiError
        {
            Status = StatusCode,
            Code = ErrorCode,
            Message = Message,
            DisplayType = DisplayType,
            Timestamp = timestamp,
            TraceId = traceId,
            Details = Details
        };
    }

    /// <summary>
    /// Converts this exception to an ApiErrorResponse object.
    /// </summary>
    public ApiErrorResponse ToApiErrorResponse(string traceId, DateTime timestamp)
    {
        return new ApiErrorResponse { Error = ToApiError(traceId, timestamp) };
    }
}
