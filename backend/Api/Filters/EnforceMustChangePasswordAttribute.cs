using Api.Common.Errors;
using Api.Exceptions;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Api.Filters;

/// <summary>
/// Action filter that blocks authenticated requests when user has MustChangePassword flag set.
/// Users must change their password before accessing protected resources.
/// </summary>
/// <remarks>
/// The must_change_password claim is read directly from the JWT token (no DB query).
///
/// When MustChangePassword is true, only specific endpoints are allowed:
/// - POST /api/auth/change-password (to change the password)
/// - POST /api/auth/logout (to logout)
/// - POST /api/auth/refresh (to refresh tokens)
/// - GET /api/me (to view profile)
///
/// All other authenticated requests return 403 Forbidden with PASSWORD_CHANGE_REQUIRED error.
/// Use [AllowMustChangePassword] attribute to bypass this filter for specific endpoints.
/// </remarks>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public sealed class EnforceMustChangePasswordAttribute : ActionFilterAttribute
{
    /// <summary>
    /// Endpoints that are allowed even when MustChangePassword is true.
    /// Format: "METHOD:PATH" where PATH can contain wildcards.
    /// </summary>
    private static readonly HashSet<string> AllowedEndpoints = new(StringComparer.OrdinalIgnoreCase)
    {
        "POST:/api/auth/change-password",
        "POST:/api/auth/logout",
        "POST:/api/auth/refresh",
        "GET:/api/me"
    };

    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // Skip if user is not authenticated
        if (context.HttpContext.User.Identity?.IsAuthenticated != true)
        {
            await next();
            return;
        }

        // Check if action or controller has AllowMustChangePassword attribute
        var hasAllowAttribute = context.ActionDescriptor.EndpointMetadata
            .Any(m => m is AllowMustChangePasswordAttribute);

        if (hasAllowAttribute)
        {
            await next();
            return;
        }

        // Check if this endpoint is in the allowed list
        var method = context.HttpContext.Request.Method;
        var path = context.HttpContext.Request.Path.Value ?? "";
        var endpointKey = $"{method}:{path}";

        if (AllowedEndpoints.Contains(endpointKey))
        {
            await next();
            return;
        }

        // Check MustChangePassword flag from JWT claim (no DB query)
        var mustChangePasswordClaim = context.HttpContext.User.FindFirst("must_change_password")?.Value;
        if (bool.TryParse(mustChangePasswordClaim, out var mustChangePassword) && mustChangePassword)
        {
            throw new ForbiddenException(
                "You must change your password before continuing",
                ErrorCodes.PASSWORD_CHANGE_REQUIRED);
        }

        await next();
    }
}

/// <summary>
/// Marks an action or controller as exempt from MustChangePassword enforcement.
/// Use this attribute on endpoints that should be accessible even when password change is required.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public sealed class AllowMustChangePasswordAttribute : Attribute
{
}
