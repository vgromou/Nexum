using Api.Common.Errors;

namespace Api.Exceptions;

/// <summary>
/// Exception for business rule violations (HTTP 422).
/// Used when the request is valid but violates business logic.
/// DisplayType: inline - should show near the action trigger.
/// </summary>
public class BusinessRuleException : ApiException
{
    public BusinessRuleException(
        string message,
        string errorCode = ErrorCodes.OPERATION_NOT_ALLOWED,
        ApiErrorDetails? details = null)
        : base(
            statusCode: 422,
            errorCode: errorCode,
            message: message,
            displayType: DisplayType.Inline,
            details: details)
    {
    }

    /// <summary>
    /// Creates an exception when operation is not allowed.
    /// </summary>
    public static BusinessRuleException NotAllowed(string reason)
    {
        return new BusinessRuleException(reason, ErrorCodes.OPERATION_NOT_ALLOWED);
    }

    /// <summary>
    /// Creates an exception when resource has dependencies.
    /// </summary>
    public static BusinessRuleException HasDependencies(string resourceType, string dependencyType)
    {
        return new BusinessRuleException(
            $"Cannot delete this {resourceType.ToLower()} because it has associated {dependencyType.ToLower()}",
            ErrorCodes.OPERATION_DEPENDENCY_EXISTS);
    }

    /// <summary>
    /// Creates an exception for invalid state transition.
    /// </summary>
    public static BusinessRuleException InvalidState(string currentState, string? targetState = null)
    {
        var message = targetState != null
            ? $"Cannot transition from '{currentState}' to '{targetState}'"
            : $"Operation not allowed in current state '{currentState}'";

        return new BusinessRuleException(message, ErrorCodes.OPERATION_INVALID_STATE);
    }

    /// <summary>
    /// Creates an exception when operation fails.
    /// </summary>
    public static BusinessRuleException OperationFailed(string reason)
    {
        return new BusinessRuleException(reason, ErrorCodes.OPERATION_FAILED);
    }

    /// <summary>
    /// Creates an exception when trying to remove the last admin.
    /// </summary>
    public static BusinessRuleException CannotRemoveLastAdmin()
    {
        return new BusinessRuleException(
            "Cannot remove the last administrator from the organization",
            ErrorCodes.CANNOT_REMOVE_LAST_ADMIN);
    }

    /// <summary>
    /// Creates an exception when a user tries to deactivate their own account.
    /// </summary>
    public static BusinessRuleException CannotDeactivateSelf()
    {
        return new BusinessRuleException(
            "You cannot deactivate your own account",
            ErrorCodes.CANNOT_DEACTIVATE_SELF);
    }

    /// <summary>
    /// Creates an exception when trying to deactivate the last active admin.
    /// </summary>
    public static BusinessRuleException CannotDeactivateLastAdmin()
    {
        return new BusinessRuleException(
            "Cannot deactivate the last active administrator in the organization",
            ErrorCodes.CANNOT_DEACTIVATE_LAST_ADMIN);
    }

    /// <summary>
    /// Creates an exception when trying to activate an already active user.
    /// </summary>
    public static BusinessRuleException UserAlreadyActive()
    {
        return new BusinessRuleException(
            "User is already active",
            ErrorCodes.USER_ALREADY_ACTIVE);
    }

    /// <summary>
    /// Space is archived, cannot perform mutations.
    /// </summary>
    public static BusinessRuleException SpaceIsArchived()
        => new(
            "Cannot perform this operation on an archived space",
            ErrorCodes.SPACE_IS_ARCHIVED);

    /// <summary>
    /// Space is already archived.
    /// </summary>
    public static BusinessRuleException SpaceAlreadyArchived()
        => new(
            "Space is already archived",
            ErrorCodes.SPACE_ALREADY_ARCHIVED);

    /// <summary>
    /// Space is not archived (cannot unarchive).
    /// </summary>
    public static BusinessRuleException SpaceNotArchived()
        => new(
            "Space is not archived",
            ErrorCodes.SPACE_NOT_ARCHIVED);

    /// <summary>
    /// Cannot remove or change the last Owner.
    /// </summary>
    public static BusinessRuleException CannotRemoveLastOwner()
        => new(
            "Cannot remove the last Owner. Transfer ownership first",
            ErrorCodes.CANNOT_REMOVE_LAST_OWNER);

    /// <summary>
    /// Cannot change Owner's role directly.
    /// </summary>
    public static BusinessRuleException CannotChangeOwnerRole()
        => new(
            "Cannot change Owner's role. Use transfer-ownership endpoint",
            ErrorCodes.CANNOT_CHANGE_OWNER_ROLE);
}
