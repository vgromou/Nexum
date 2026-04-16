using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Api.Swagger;

/// <summary>
/// Document filter that adds error schema definitions to Swagger documentation.
/// </summary>
public class ErrorSchemaDocumentFilter : IDocumentFilter
{
    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        // Add schemas only if they don't already exist (avoids duplication with auto-generated schemas)
        swaggerDoc.Components.Schemas.TryAdd("DisplayType", CreateDisplayTypeSchema());
        swaggerDoc.Components.Schemas.TryAdd("FieldError", CreateFieldErrorSchema());
        swaggerDoc.Components.Schemas.TryAdd("ApiErrorDetails", CreateApiErrorDetailsSchema());
        swaggerDoc.Components.Schemas.TryAdd("ApiError", CreateApiErrorSchema());
        swaggerDoc.Components.Schemas.TryAdd("ApiErrorResponse", CreateApiErrorResponseSchema());

        // Add Error Codes to description
        AddErrorCodesDescription(swaggerDoc);
    }

    private static OpenApiSchema CreateDisplayTypeSchema() => new()
    {
        Type = "string",
        Description = "Specifies how the frontend should display the error",
        Enum = new List<IOpenApiAny>
        {
            new OpenApiString("page"),
            new OpenApiString("toast"),
            new OpenApiString("field"),
            new OpenApiString("inline")
        }
    };

    private static OpenApiSchema CreateFieldErrorSchema() => new()
    {
        Type = "object",
        Description = "Validation error for a specific field",
        Required = new HashSet<string> { "code", "message" },
        Properties = new Dictionary<string, OpenApiSchema>
        {
            ["code"] = new OpenApiSchema
            {
                Type = "string",
                Description = "Machine-readable error code (e.g., VALIDATION_REQUIRED)",
                Example = new OpenApiString("VALIDATION_MIN_LENGTH")
            },
            ["message"] = new OpenApiSchema
            {
                Type = "string",
                Description = "Human-readable error message",
                Example = new OpenApiString("Password must be at least 8 characters")
            },
            ["params"] = new OpenApiSchema
            {
                Type = "object",
                Description = "Additional parameters (e.g., min/max values)",
                AdditionalPropertiesAllowed = true,
                Nullable = true
            }
        }
    };

    private static OpenApiSchema CreateApiErrorDetailsSchema() => new()
    {
        Type = "object",
        Description = "Additional error details",
        Properties = new Dictionary<string, OpenApiSchema>
        {
            ["fields"] = new OpenApiSchema
            {
                Type = "object",
                Description = "Field-specific validation errors (key: field name, value: array of errors)",
                AdditionalProperties = new OpenApiSchema
                {
                    Type = "array",
                    Items = new OpenApiSchema
                    {
                        Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = "FieldError" }
                    }
                },
                Nullable = true
            },
            ["context"] = new OpenApiSchema
            {
                Type = "object",
                Description = "Additional context information",
                AdditionalPropertiesAllowed = true,
                Nullable = true
            }
        }
    };

    private static OpenApiSchema CreateApiErrorSchema() => new()
    {
        Type = "object",
        Description = "The main error object containing all error details",
        Required = new HashSet<string> { "status", "code", "message", "displayType", "timestamp", "traceId" },
        Properties = new Dictionary<string, OpenApiSchema>
        {
            ["status"] = new OpenApiSchema
            {
                Type = "integer",
                Description = "HTTP status code",
                Example = new OpenApiInteger(400)
            },
            ["code"] = new OpenApiSchema
            {
                Type = "string",
                Description = "Machine-readable error code in SCREAMING_SNAKE_CASE",
                Example = new OpenApiString("VALIDATION_ERROR")
            },
            ["message"] = new OpenApiSchema
            {
                Type = "string",
                Description = "Human-readable error message",
                Example = new OpenApiString("Validation failed")
            },
            ["displayType"] = new OpenApiSchema
            {
                Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = "DisplayType" }
            },
            ["timestamp"] = new OpenApiSchema
            {
                Type = "string",
                Format = "date-time",
                Description = "ISO 8601 timestamp when the error occurred",
                Example = new OpenApiString("2026-01-15T12:00:00Z")
            },
            ["traceId"] = new OpenApiSchema
            {
                Type = "string",
                Description = "Unique identifier for request tracing",
                Example = new OpenApiString("0HN4C0QNLR:00000001")
            },
            ["details"] = new OpenApiSchema
            {
                Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = "ApiErrorDetails" },
                Nullable = true
            }
        }
    };

    private static OpenApiSchema CreateApiErrorResponseSchema() => new()
    {
        Type = "object",
        Description = "Standard error response wrapper. All API errors are wrapped in this structure.",
        Required = new HashSet<string> { "error" },
        Properties = new Dictionary<string, OpenApiSchema>
        {
            ["error"] = new OpenApiSchema
            {
                Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = "ApiError" }
            }
        }
    };

    private static void AddErrorCodesDescription(OpenApiDocument swaggerDoc)
    {
        // Only add if not already present
        if (swaggerDoc.Info.Description?.Contains("## Error Handling") == true)
            return;

        var errorCodesMarkdown = @"

## Error Handling

All API errors follow a consistent structure wrapped in an `error` object.

### Display Types

| Type | Usage |
|------|-------|
| `page` | Full-page error (404, 403, session expired) |
| `toast` | Auto-dismiss notification (save failed, network errors) |
| `field` | Validation errors under form fields |
| `inline` | Contextual error near the action trigger |

### Error Codes

#### Authentication (AUTH_*) - Status 401

| Code | Display | Description |
|------|---------|-------------|
| `AUTH_INVALID_CREDENTIALS` | field | Wrong email/username or password |
| `AUTH_TOKEN_EXPIRED` | page | JWT access token expired |
| `AUTH_TOKEN_INVALID` | page | Access token is malformed or invalid |
| `AUTH_REFRESH_TOKEN_EXPIRED` | page | Refresh token has expired |
| `AUTH_SESSION_EXPIRED` | page | User session has expired, re-login required |
| `AUTH_ACCOUNT_LOCKED` | field | Too many failed login attempts |
| `AUTH_ACCOUNT_DISABLED` | field | Account has been disabled by admin |

#### Authorization (ACCESS_*) - Status 403

| Code | Display | Description |
|------|---------|-------------|
| `ACCESS_DENIED` | page | Access to resource denied |
| `ACCESS_FORBIDDEN` | page | Action not permitted |
| `ACCESS_INSUFFICIENT_PERMISSIONS` | toast/inline | Missing required permissions |

#### Validation (VALIDATION_*) - Status 400

| Code | Display | Description |
|------|---------|-------------|
| `VALIDATION_ERROR` | field | General validation failure |
| `VALIDATION_REQUIRED` | field | Required field is missing |
| `VALIDATION_INVALID_FORMAT` | field | Field has invalid format |
| `VALIDATION_MIN_LENGTH` | field | Value below minimum length |
| `VALIDATION_MAX_LENGTH` | field | Value exceeds maximum length |
| `VALIDATION_INVALID_EMAIL` | field | Invalid email format |
| `VALIDATION_ALREADY_EXISTS` | field | Value must be unique |
| `VALIDATION_INVALID_VALUE` | field | Value not in allowed set |

#### Resources (RESOURCE_*)

| Code | Status | Display | Description |
|------|--------|---------|-------------|
| `RESOURCE_NOT_FOUND` | 404 | page | Resource does not exist |
| `RESOURCE_ALREADY_EXISTS` | 409 | toast | Resource already exists |
| `RESOURCE_DELETED` | 410 | page | Resource was deleted |

#### Conflicts (CONFLICT_*) - Status 409

| Code | Display | Description |
|------|---------|-------------|
| `CONFLICT_DUPLICATE_ENTRY` | toast | Duplicate entry detected |
| `CONFLICT_CONCURRENT_EDIT` | toast | Concurrent modification detected |
| `CONFLICT_VERSION_MISMATCH` | toast | Optimistic locking failure |

#### Operations (OPERATION_*)

| Code | Status | Display | Description |
|------|--------|---------|-------------|
| `OPERATION_NOT_ALLOWED` | 422 | inline | Business rule prevents operation |
| `OPERATION_FAILED` | 500 | toast | Operation failed unexpectedly |
| `OPERATION_TIMEOUT` | 504 | toast | Operation took too long |

#### Server (SERVER_*)

| Code | Status | Display | Description |
|------|--------|---------|-------------|
| `SERVER_ERROR` | 500 | toast | Unexpected server error |
| `SERVER_UNAVAILABLE` | 503 | toast | Service temporarily unavailable |
| `SERVER_MAINTENANCE` | 503 | page | Planned maintenance mode |
| `SAVE_FAILED` | 500 | toast | Failed to save changes (retryable) |

#### Rate Limiting - Status 429

| Code | Display | Description |
|------|---------|-------------|
| `RATE_LIMIT_EXCEEDED` | toast | Too many requests |
";

        swaggerDoc.Info.Description += errorCodesMarkdown;
    }
}
