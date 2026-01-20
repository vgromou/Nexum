using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.Exceptions;
using Api.Extensions;

namespace Api.Filters;

/// <summary>
/// Action filter that blocks authenticated requests when user has MustChangePassword flag set.
/// Users must change their password before accessing protected resources.
/// </summary>
/// <remarks>
/// When MustChangePassword is true, only specific endpoints are allowed:
/// - POST /api/auth/change-password (to change the password)
/// - POST /api/auth/logout (to logout)
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

        // Get user ID from claims
        var userId = context.HttpContext.User.GetUserId();
        if (!userId.HasValue)
        {
            await next();
            return;
        }

        // Check MustChangePassword flag from database
        var dbContext = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
        var mustChangePassword = await dbContext.Users
            .Where(u => u.Id == userId.Value)
            .Select(u => u.MustChangePassword)
            .FirstOrDefaultAsync();

        if (mustChangePassword)
        {
            throw new ForbiddenException(
                "Password change required. Please change your password before accessing this resource.",
                "PASSWORD_CHANGE_REQUIRED");
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
