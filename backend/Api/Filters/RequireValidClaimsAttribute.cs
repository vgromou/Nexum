using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Api.Exceptions;
using Api.Extensions;

namespace Api.Filters;

/// <summary>
/// Action filter that validates JWT claims (user ID and organization ID) are present.
/// Throws UnauthorizedException if claims are missing.
/// </summary>
/// <remarks>
/// Use this filter on controller actions that require valid user and organization claims.
/// The validated claims are stored in HttpContext.Items and can be accessed via
/// the GetValidatedUserId() and GetValidatedOrganizationId() extension methods.
/// </remarks>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public sealed class RequireValidClaimsAttribute : ActionFilterAttribute
{
    /// <summary>
    /// Key for storing validated user ID in HttpContext.Items.
    /// </summary>
    public const string UserIdKey = "ValidatedUserId";

    /// <summary>
    /// Key for storing validated organization ID in HttpContext.Items.
    /// </summary>
    public const string OrganizationIdKey = "ValidatedOrganizationId";

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        var userId = context.HttpContext.User.GetUserId();
        var organizationId = context.HttpContext.User.GetOrganizationId();

        if (!userId.HasValue || !organizationId.HasValue)
        {
            throw new UnauthorizedException(
                "Invalid token: user ID or organization ID not found in claims.",
                "UNAUTHORIZED");
        }

        // Store validated claims in HttpContext for easy access in the action
        context.HttpContext.Items[UserIdKey] = userId.Value;
        context.HttpContext.Items[OrganizationIdKey] = organizationId.Value;

        base.OnActionExecuting(context);
    }
}

/// <summary>
/// Extension methods for accessing validated claims from HttpContext.
/// </summary>
public static class ValidatedClaimsExtensions
{
    /// <summary>
    /// Gets the validated user ID from HttpContext.Items or throws UnauthorizedException.
    /// When RequireValidClaimsAttribute is applied, it uses the cached value.
    /// Otherwise, it validates claims directly and throws if missing.
    /// </summary>
    /// <param name="httpContext">The HTTP context.</param>
    /// <returns>The validated user ID.</returns>
    /// <exception cref="UnauthorizedException">Thrown if user ID claim is missing.</exception>
    public static Guid GetValidatedUserId(this HttpContext httpContext)
    {
        // Check if filter has already validated and cached the value
        if (httpContext.Items.TryGetValue(RequireValidClaimsAttribute.UserIdKey, out var userId))
        {
            return (Guid)userId!;
        }

        // Fallback: validate directly from claims (for unit tests or when filter is not applied)
        var claimUserId = httpContext.User.GetUserId();
        if (!claimUserId.HasValue)
        {
            throw new UnauthorizedException(
                "Invalid token: user ID or organization ID not found in claims.",
                "UNAUTHORIZED");
        }
        return claimUserId.Value;
    }

    /// <summary>
    /// Gets the validated organization ID from HttpContext.Items or throws UnauthorizedException.
    /// When RequireValidClaimsAttribute is applied, it uses the cached value.
    /// Otherwise, it validates claims directly and throws if missing.
    /// </summary>
    /// <param name="httpContext">The HTTP context.</param>
    /// <returns>The validated organization ID.</returns>
    /// <exception cref="UnauthorizedException">Thrown if organization ID claim is missing.</exception>
    public static Guid GetValidatedOrganizationId(this HttpContext httpContext)
    {
        // Check if filter has already validated and cached the value
        if (httpContext.Items.TryGetValue(RequireValidClaimsAttribute.OrganizationIdKey, out var organizationId))
        {
            return (Guid)organizationId!;
        }

        // Fallback: validate directly from claims (for unit tests or when filter is not applied)
        var claimOrgId = httpContext.User.GetOrganizationId();
        if (!claimOrgId.HasValue)
        {
            throw new UnauthorizedException(
                "Invalid token: user ID or organization ID not found in claims.",
                "UNAUTHORIZED");
        }
        return claimOrgId.Value;
    }
}
