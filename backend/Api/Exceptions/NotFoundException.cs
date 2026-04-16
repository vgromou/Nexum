using Api.Common.Errors;

namespace Api.Exceptions;

/// <summary>
/// Exception for resource not found errors (HTTP 404).
/// DisplayType: page - should show not found page.
/// </summary>
public class NotFoundException : ApiException
{
    public NotFoundException(
        string message = "Resource not found",
        string errorCode = ErrorCodes.RESOURCE_NOT_FOUND)
        : base(
            statusCode: 404,
            errorCode: errorCode,
            message: message,
            displayType: DisplayType.Page)
    {
    }

    /// <summary>
    /// Creates a NotFoundException for a specific resource type.
    /// </summary>
    public static NotFoundException ForResource(string resourceType, object? id = null)
    {
        var message = id != null
            ? $"{resourceType} with ID '{id}' not found"
            : $"{resourceType} not found";

        return new NotFoundException(message);
    }

    /// <summary>
    /// Creates a NotFoundException for a user.
    /// </summary>
    public static NotFoundException User(Guid? id = null) => ForResource("User", id);

    /// <summary>
    /// Creates a NotFoundException for an organization.
    /// </summary>
    public static NotFoundException Organization(Guid? id = null) => ForResource("Organization", id);

    /// <summary>
    /// Creates a NotFoundException for an organization member.
    /// </summary>
    public static NotFoundException Member(Guid userId, Guid organizationId)
    {
        return new NotFoundException(
            $"User with ID '{userId}' is not a member of organization '{organizationId}'",
            ErrorCodes.MEMBER_NOT_FOUND);
    }

    /// <summary>
    /// Creates a NotFoundException for a space.
    /// </summary>
    public static NotFoundException Space(Guid? id = null)
        => new(
            id != null ? $"Space with ID '{id}' not found" : "Space not found",
            ErrorCodes.SPACE_NOT_FOUND);

    /// <summary>
    /// Creates a NotFoundException for a space member.
    /// </summary>
    public static NotFoundException SpaceMember(Guid userId, Guid spaceId)
        => new(
            $"User with ID '{userId}' is not a member of space '{spaceId}'",
            ErrorCodes.SPACE_MEMBER_NOT_FOUND);
}
