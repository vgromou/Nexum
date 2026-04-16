using System.Text.Json;
using System.Text.Json.Serialization;
using Api.Common.Errors;
using Api.Exceptions;

namespace Api.Middleware;

/// <summary>
/// Global exception handler middleware.
/// Catches all exceptions and converts them to standardized API error responses.
/// Must be registered first in the middleware pipeline.
/// </summary>
public class ApiExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiExceptionMiddleware> _logger;
    private readonly IHostEnvironment _environment;
    private readonly TimeProvider _timeProvider;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
    };

    public ApiExceptionMiddleware(
        RequestDelegate next,
        ILogger<ApiExceptionMiddleware> logger,
        IHostEnvironment environment,
        TimeProvider? timeProvider = null)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var traceId = context.TraceIdentifier;
        var timestamp = _timeProvider.GetUtcNow().UtcDateTime;

        var (statusCode, errorResponse) = exception switch
        {
            OperationCanceledException => HandleClientClosedRequest(traceId, timestamp),
            ApiException apiEx => HandleApiException(apiEx, traceId, timestamp),
            _ => HandleUnexpectedException(exception, traceId, timestamp)
        };

        // Log the exception
        LogException(exception, traceId, statusCode);

        // Write response
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        // Add Retry-After header for rate limit exceptions
        if (exception is RateLimitException rateLimitEx && rateLimitEx.RetryAfterSeconds.HasValue)
        {
            context.Response.Headers.RetryAfter = rateLimitEx.RetryAfterSeconds.Value.ToString();
        }

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(errorResponse, JsonOptions));
    }

    private static (int StatusCode, ApiErrorResponse Response) HandleApiException(
        ApiException exception,
        string traceId,
        DateTime timestamp)
    {
        return (exception.StatusCode, exception.ToApiErrorResponse(traceId, timestamp));
    }

    private static (int StatusCode, ApiErrorResponse Response) HandleClientClosedRequest(
        string traceId,
        DateTime timestamp)
    {
        var response = new ApiErrorResponse
        {
            Error = new ApiError
            {
                Status = 499,
                Code = ErrorCodes.CLIENT_CLOSED_REQUEST,
                Message = "Client closed the request",
                DisplayType = DisplayType.None,
                Timestamp = timestamp,
                TraceId = traceId
            }
        };

        return (499, response);
    }

    private (int StatusCode, ApiErrorResponse Response) HandleUnexpectedException(
        Exception exception,
        string traceId,
        DateTime timestamp)
    {
        // In development, we can include more details
        var message = _environment.IsDevelopment()
            ? $"An unexpected error occurred: {exception.Message}"
            : "An unexpected error occurred";

        var response = new ApiErrorResponse
        {
            Error = new ApiError
            {
                Status = 500,
                Code = ErrorCodes.SERVER_ERROR,
                Message = message,
                DisplayType = DisplayType.Toast,
                Timestamp = timestamp,
                TraceId = traceId,
                // Include stack trace in development only
                Details = _environment.IsDevelopment()
                    ? new ApiErrorDetails
                    {
                        Context = new Dictionary<string, object>
                        {
                            ["exceptionType"] = exception.GetType().Name,
                            ["stackTrace"] = exception.StackTrace ?? string.Empty
                        }
                    }
                    : null
            }
        };

        return (500, response);
    }

    private void LogException(Exception exception, string traceId, int statusCode)
    {
        // Client closed request - log at debug level without stack trace
        if (exception is OperationCanceledException)
        {
            _logger.LogDebug(
                "Request {TraceId} was cancelled by client",
                traceId);
            return;
        }

        var logLevel = statusCode switch
        {
            >= 500 => LogLevel.Error,
            >= 400 => LogLevel.Warning,
            _ => LogLevel.Information
        };

        _logger.Log(
            logLevel,
            exception,
            "Request {TraceId} failed with status {StatusCode}: {Message}",
            traceId,
            statusCode,
            exception.Message);
    }
}

/// <summary>
/// Extension methods for registering the API exception middleware.
/// </summary>
public static class ApiExceptionMiddlewareExtensions
{
    /// <summary>
    /// Adds the API exception handling middleware to the pipeline.
    /// Should be called first in the middleware pipeline.
    /// </summary>
    public static IApplicationBuilder UseApiExceptionHandling(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ApiExceptionMiddleware>();
    }
}
