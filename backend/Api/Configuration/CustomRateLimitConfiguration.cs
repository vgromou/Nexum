using System.Text.Json;
using AspNetCoreRateLimit;
using Microsoft.Extensions.Options;
using Api.Common.Errors;

namespace Api.Configuration;

/// <summary>
/// Custom rate limit configuration that formats 429 responses
/// according to the API error response standard.
/// </summary>
public class CustomRateLimitConfiguration : RateLimitConfiguration
{
    public CustomRateLimitConfiguration(IOptions<IpRateLimitOptions> ipOptions,
        IOptions<ClientRateLimitOptions> clientOptions)
        : base(ipOptions, clientOptions)
    {
    }

    public override void RegisterResolvers()
    {
        base.RegisterResolvers();
    }
}

/// <summary>
/// Custom IP rate limit middleware that returns proper JSON error responses.
/// </summary>
public class CustomIpRateLimitMiddleware : IpRateLimitMiddleware
{
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly TimeProvider _timeProvider;

    public CustomIpRateLimitMiddleware(
        RequestDelegate next,
        IProcessingStrategy processingStrategy,
        IOptions<IpRateLimitOptions> options,
        IIpPolicyStore policyStore,
        IRateLimitConfiguration config,
        ILogger<IpRateLimitMiddleware> logger,
        TimeProvider timeProvider)
        : base(next, processingStrategy, options, policyStore, config, logger)
    {
        _timeProvider = timeProvider;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    public override Task ReturnQuotaExceededResponse(HttpContext httpContext, RateLimitRule rule, string retryAfter)
    {
        var retryAfterMs = 60000; // Default 60 seconds
        if (int.TryParse(retryAfter, out var seconds))
        {
            retryAfterMs = seconds * 1000;
        }

        var errorResponse = new ApiErrorResponse
        {
            Error = new ApiError
            {
                Status = 429,
                Code = "RATE_LIMIT_EXCEEDED",
                Message = GetMessageForEndpoint(httpContext.Request.Path),
                DisplayType = DisplayType.Toast,
                Timestamp = _timeProvider.GetUtcNow().UtcDateTime,
                TraceId = httpContext.TraceIdentifier,
                Details = new ApiErrorDetails
                {
                    Context = new Dictionary<string, object>
                    {
                        { "retryAfterMs", retryAfterMs },
                        { "limit", rule.Limit },
                        { "period", rule.Period }
                    }
                }
            }
        };

        httpContext.Response.Headers.RetryAfter = retryAfter;
        httpContext.Response.Headers["X-RateLimit-Limit"] = rule.Limit.ToString();
        httpContext.Response.Headers["X-RateLimit-Remaining"] = "0";
        httpContext.Response.Headers["X-RateLimit-Reset"] = _timeProvider.GetUtcNow().AddSeconds(retryAfterMs / 1000).ToUnixTimeSeconds().ToString();

        httpContext.Response.StatusCode = 429;
        httpContext.Response.ContentType = "application/json";

        return httpContext.Response.WriteAsync(JsonSerializer.Serialize(errorResponse, _jsonOptions));
    }

    private static string GetMessageForEndpoint(string path)
    {
        if (path.Contains("/auth/login", StringComparison.OrdinalIgnoreCase))
        {
            return "Too many login attempts. Please try again later";
        }

        if (path.Contains("/auth/", StringComparison.OrdinalIgnoreCase))
        {
            return "Too many authentication requests. Please try again later";
        }

        return "Too many requests. Please try again later";
    }
}

/// <summary>
/// Extension methods for custom rate limiting.
/// </summary>
public static class CustomRateLimitExtensions
{
    /// <summary>
    /// Adds custom IP rate limiting middleware with proper JSON error responses.
    /// </summary>
    public static IApplicationBuilder UseCustomIpRateLimiting(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<CustomIpRateLimitMiddleware>();
    }
}
