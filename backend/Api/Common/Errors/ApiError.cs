using System.Text.Json.Serialization;

namespace Api.Common.Errors;

/// <summary>
/// Represents the main error object in API error responses.
/// </summary>
public sealed class ApiError
{
    /// <summary>
    /// HTTP status code (e.g., 400, 401, 404, 500).
    /// </summary>
    [JsonPropertyName("status")]
    public required int Status { get; init; }

    /// <summary>
    /// Machine-readable error code in SCREAMING_SNAKE_CASE (e.g., VALIDATION_ERROR, RESOURCE_NOT_FOUND).
    /// </summary>
    [JsonPropertyName("code")]
    public required string Code { get; init; }

    /// <summary>
    /// Human-readable error message in English.
    /// </summary>
    [JsonPropertyName("message")]
    public required string Message { get; init; }

    /// <summary>
    /// Hint for frontend on how to display this error.
    /// </summary>
    [JsonPropertyName("displayType")]
    public required DisplayType DisplayType { get; init; }

    /// <summary>
    /// ISO 8601 timestamp of when the error occurred.
    /// </summary>
    [JsonPropertyName("timestamp")]
    public required DateTime Timestamp { get; init; }

    /// <summary>
    /// Unique identifier for request tracing and debugging.
    /// </summary>
    [JsonPropertyName("traceId")]
    public required string TraceId { get; init; }

    /// <summary>
    /// Optional additional details about the error.
    /// For validation errors, contains field-specific errors.
    /// </summary>
    [JsonPropertyName("details")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ApiErrorDetails? Details { get; init; }
}

/// <summary>
/// Contains additional error details.
/// </summary>
public sealed class ApiErrorDetails
{
    /// <summary>
    /// Field-specific validation errors.
    /// Key is the field name, value is list of errors for that field.
    /// </summary>
    [JsonPropertyName("fields")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Dictionary<string, List<FieldError>>? Fields { get; init; }

    /// <summary>
    /// Additional context information.
    /// </summary>
    [JsonPropertyName("context")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Dictionary<string, object>? Context { get; init; }
}
