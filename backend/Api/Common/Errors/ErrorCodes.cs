namespace Api.Common.Errors;

/// <summary>
/// Centralized error codes for API responses.
/// All codes follow SCREAMING_SNAKE_CASE convention.
/// </summary>
public static class ErrorCodes
{
    // Authentication errors (AUTH_*) - Status 401
    public const string AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS";
    public const string AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED";
    public const string AUTH_TOKEN_INVALID = "AUTH_TOKEN_INVALID";
    public const string AUTH_REFRESH_TOKEN_EXPIRED = "AUTH_REFRESH_TOKEN_EXPIRED";
    public const string AUTH_TOKEN_REVOKED = "AUTH_TOKEN_REVOKED";
    public const string AUTH_SESSION_EXPIRED = "AUTH_SESSION_EXPIRED";
    public const string AUTH_ACCOUNT_LOCKED = "AUTH_ACCOUNT_LOCKED";
    public const string AUTH_ACCOUNT_DISABLED = "AUTH_ACCOUNT_DISABLED";

    // Authorization errors (ACCESS_*) - Status 403
    public const string ACCESS_DENIED = "ACCESS_DENIED";
    public const string ACCESS_FORBIDDEN = "ACCESS_FORBIDDEN";
    public const string ACCESS_INSUFFICIENT_PERMISSIONS = "ACCESS_INSUFFICIENT_PERMISSIONS";
    public const string ACCESS_ORGANIZATION_REQUIRED = "ACCESS_ORGANIZATION_REQUIRED";

    // Bad request errors - Status 400
    public const string BAD_REQUEST = "BAD_REQUEST";
    public const string INVALID_INPUT = "INVALID_INPUT";

    // Validation errors (VALIDATION_*) - Status 400
    public const string VALIDATION_MISSING_CONFIRMATION = "VALIDATION_MISSING_CONFIRMATION";
    public const string VALIDATION_ERROR = "VALIDATION_ERROR";
    public const string VALIDATION_REQUIRED = "VALIDATION_REQUIRED";
    public const string VALIDATION_INVALID_FORMAT = "VALIDATION_INVALID_FORMAT";
    public const string VALIDATION_MIN_LENGTH = "VALIDATION_MIN_LENGTH";
    public const string VALIDATION_MAX_LENGTH = "VALIDATION_MAX_LENGTH";
    public const string VALIDATION_INVALID_EMAIL = "VALIDATION_INVALID_EMAIL";
    public const string VALIDATION_ALREADY_EXISTS = "VALIDATION_ALREADY_EXISTS";
    public const string VALIDATION_INVALID_VALUE = "VALIDATION_INVALID_VALUE";
    public const string VALIDATION_OUT_OF_RANGE = "VALIDATION_OUT_OF_RANGE";

    // Resource errors (RESOURCE_*)
    public const string RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND";         // 404
    public const string RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS"; // 409
    public const string RESOURCE_DELETED = "RESOURCE_DELETED";             // 410
    public const string MEMBER_NOT_FOUND = "MEMBER_NOT_FOUND";             // 404

    // Conflict errors (CONFLICT_*) - Status 409
    public const string CONFLICT_DUPLICATE_ENTRY = "CONFLICT_DUPLICATE_ENTRY";
    public const string CONFLICT_CONCURRENT_EDIT = "CONFLICT_CONCURRENT_EDIT";
    public const string CONFLICT_VERSION_MISMATCH = "CONFLICT_VERSION_MISMATCH";
    public const string CONFLICT_EMAIL_EXISTS = "EMAIL_EXISTS";
    public const string CONFLICT_USERNAME_EXISTS = "USERNAME_EXISTS";
    public const string CONFLICT_ORGANIZATION_EXISTS = "ORGANIZATION_EXISTS";
    public const string CONFLICT_SLUG_EXISTS = "SLUG_EXISTS";

    // Operation errors (OPERATION_*)
    public const string OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED";   // 422
    public const string OPERATION_FAILED = "OPERATION_FAILED";             // 500
    public const string OPERATION_TIMEOUT = "OPERATION_TIMEOUT";           // 504
    public const string OPERATION_INVALID_STATE = "OPERATION_INVALID_STATE"; // 422
    public const string OPERATION_DEPENDENCY_EXISTS = "OPERATION_DEPENDENCY_EXISTS"; // 422
    public const string CANNOT_REMOVE_LAST_ADMIN = "CANNOT_REMOVE_LAST_ADMIN"; // 422
    public const string CANNOT_DEACTIVATE_SELF = "CANNOT_DEACTIVATE_SELF"; // 422
    public const string CANNOT_DEACTIVATE_LAST_ADMIN = "CANNOT_DEACTIVATE_LAST_ADMIN"; // 422

    // Server errors (SERVER_*)
    public const string SERVER_ERROR = "SERVER_ERROR";                     // 500
    public const string SERVER_UNAVAILABLE = "SERVER_UNAVAILABLE";         // 503
    public const string SERVER_MAINTENANCE = "SERVER_MAINTENANCE";         // 503
    public const string SERVER_TIMEOUT = "SERVER_TIMEOUT";                 // 504
    public const string SERVER_EXTERNAL_SERVICE_ERROR = "SERVER_EXTERNAL_SERVICE_ERROR"; // 502

    // Rate limiting - Status 429
    public const string RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED";

    // Save errors - Status 500
    public const string SAVE_FAILED = "SAVE_FAILED";

    // Client errors - Status 499
    public const string CLIENT_CLOSED_REQUEST = "CLIENT_CLOSED_REQUEST";
}
