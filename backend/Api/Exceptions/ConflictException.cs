using Api.Common.Errors;

namespace Api.Exceptions;

/// <summary>
/// Exception for conflict errors (HTTP 409).
/// Used for concurrent edits, version mismatches, duplicate entries.
/// DisplayType: toast - should show auto-dismiss notification.
/// </summary>
public class ConflictException : ApiException
{
    public ConflictException(
        string message = "A conflict occurred",
        string errorCode = ErrorCodes.CONFLICT_CONCURRENT_EDIT)
        : base(
            statusCode: 409,
            errorCode: errorCode,
            message: message,
            displayType: DisplayType.Toast)
    {
    }

    /// <summary>
    /// Creates an exception for concurrent edit conflict.
    /// </summary>
    public static ConflictException ConcurrentEdit(string? resourceType = null)
    {
        var message = resourceType != null
            ? $"The {resourceType.ToLower()} has been modified by another user. Please refresh and try again"
            : "This resource has been modified by another user. Please refresh and try again";

        return new ConflictException(message, ErrorCodes.CONFLICT_CONCURRENT_EDIT);
    }

    /// <summary>
    /// Creates an exception for version mismatch.
    /// </summary>
    public static ConflictException VersionMismatch()
    {
        return new ConflictException(
            "The data has changed since you last loaded it. Please refresh and try again",
            ErrorCodes.CONFLICT_VERSION_MISMATCH);
    }

    /// <summary>
    /// Creates an exception for duplicate entry.
    /// </summary>
    public static ConflictException DuplicateEntry(string fieldName, object? value = null)
    {
        var message = value != null
            ? $"A record with {fieldName} '{value}' already exists"
            : $"A record with this {fieldName} already exists";

        return new ConflictException(message, ErrorCodes.CONFLICT_DUPLICATE_ENTRY);
    }

    /// <summary>
    /// Creates an exception when resource already exists.
    /// </summary>
    public static ConflictException AlreadyExists(string resourceType)
    {
        return new ConflictException(
            $"{resourceType} already exists",
            ErrorCodes.RESOURCE_ALREADY_EXISTS);
    }

    /// <summary>
    /// Creates an exception when email already exists.
    /// </summary>
    public static ConflictException EmailExists(string email)
    {
        return new ConflictException(
            $"A user with email '{email}' already exists",
            ErrorCodes.CONFLICT_EMAIL_EXISTS);
    }

    /// <summary>
    /// Creates an exception when username already exists.
    /// </summary>
    public static ConflictException UsernameExists(string username)
    {
        return new ConflictException(
            $"A user with username '{username}' already exists",
            ErrorCodes.CONFLICT_USERNAME_EXISTS);
    }

    /// <summary>
    /// Creates an exception when organization already exists (single-tenant constraint).
    /// </summary>
    public static ConflictException OrganizationExists()
    {
        return new ConflictException(
            "An organization already exists. Only one organization is allowed in single-tenant mode",
            ErrorCodes.CONFLICT_ORGANIZATION_EXISTS);
    }

    /// <summary>
    /// Creates an exception when organization slug already exists.
    /// </summary>
    public static ConflictException SlugExists(string slug)
    {
        return new ConflictException(
            $"An organization with slug '{slug}' already exists",
            ErrorCodes.CONFLICT_SLUG_EXISTS);
    }

    /// <summary>
    /// Creates an exception when space slug already exists in the organization.
    /// </summary>
    public static ConflictException SpaceSlugExists(string slug)
    {
        return new ConflictException(
            $"A space with slug '{slug}' already exists in this organization",
            ErrorCodes.SPACE_SLUG_EXISTS);
    }

    /// <summary>
    /// Creates an exception when user is already a space member.
    /// </summary>
    public static ConflictException SpaceMemberExists(Guid userId)
    {
        return new ConflictException(
            $"User with ID '{userId}' is already a member of this space",
            ErrorCodes.SPACE_MEMBER_EXISTS);
    }
}
