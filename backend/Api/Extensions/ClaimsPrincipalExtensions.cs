using System.Security.Claims;

namespace Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid? GetOrganizationId(this ClaimsPrincipal principal)
    {
        var orgIdClaim = principal.FindFirst("org_id")?.Value;
        return Guid.TryParse(orgIdClaim, out var orgId) ? orgId : null;
    }

    public static Guid? GetUserId(this ClaimsPrincipal principal)
    {
        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
