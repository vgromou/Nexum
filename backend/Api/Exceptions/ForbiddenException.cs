using Api.Common.Errors;

namespace Api.Exceptions;

/// <summary>
/// Exception for authorization errors (HTTP 403).
/// Used when user is authenticated but doesn't have permission.
/// DisplayType: page - should show access denied page.
/// </summary>
public class ForbiddenException : ApiException
{
    public ForbiddenException(
        string message = "You don't have permission to access this resource",
        string errorCode = ErrorCodes.ACCESS_FORBIDDEN)
        : base(
            statusCode: 403,
            errorCode: errorCode,
            message: message,
            displayType: DisplayType.Page)
    {
    }

    /// <summary>
    /// Creates an exception for insufficient permissions.
    /// </summary>
    public static ForbiddenException InsufficientPermissions(string? action = null)
    {
        var message = action != null
            ? $"You don't have permission to {action}"
            : "You don't have permission to perform this action";

        return new ForbiddenException(message, ErrorCodes.ACCESS_INSUFFICIENT_PERMISSIONS);
    }

    /// <summary>
    /// Creates an exception when organization access is required.
    /// </summary>
    public static ForbiddenException OrganizationRequired()
    {
        return new ForbiddenException(
            "You must be a member of an organization to access this resource",
            ErrorCodes.ACCESS_ORGANIZATION_REQUIRED);
    }
}
