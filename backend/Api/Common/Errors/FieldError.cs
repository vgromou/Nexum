using System.Text.Json.Serialization;

namespace Api.Common.Errors;

/// <summary>
/// Represents a validation error for a specific field.
/// </summary>
public sealed class FieldError
{
    /// <summary>
    /// Machine-readable error code (e.g., VALIDATION_REQUIRED, VALIDATION_MIN_LENGTH).
    /// </summary>
    [JsonPropertyName("code")]
    public required string Code { get; init; }

    /// <summary>
    /// Human-readable error message in English.
    /// </summary>
    [JsonPropertyName("message")]
    public required string Message { get; init; }

    /// <summary>
    /// Optional parameters providing additional context (e.g., min/max values).
    /// </summary>
    [JsonPropertyName("params")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Dictionary<string, object>? Params { get; init; }

    public static FieldError Required(string fieldName) => new()
    {
        Code = ErrorCodes.VALIDATION_REQUIRED,
        Message = $"{fieldName} is required"
    };

    public static FieldError InvalidFormat(string fieldName, string? expectedFormat = null) => new()
    {
        Code = ErrorCodes.VALIDATION_INVALID_FORMAT,
        Message = expectedFormat != null
            ? $"{fieldName} has invalid format. Expected: {expectedFormat}"
            : $"{fieldName} has invalid format"
    };

    public static FieldError MinLength(string fieldName, int minLength) => new()
    {
        Code = ErrorCodes.VALIDATION_MIN_LENGTH,
        Message = $"{fieldName} must be at least {minLength} characters",
        Params = new Dictionary<string, object> { ["minLength"] = minLength }
    };

    public static FieldError MaxLength(string fieldName, int maxLength) => new()
    {
        Code = ErrorCodes.VALIDATION_MAX_LENGTH,
        Message = $"{fieldName} must not exceed {maxLength} characters",
        Params = new Dictionary<string, object> { ["maxLength"] = maxLength }
    };

    public static FieldError InvalidEmail() => new()
    {
        Code = ErrorCodes.VALIDATION_INVALID_EMAIL,
        Message = "Invalid email format"
    };

    public static FieldError OutOfRange(string fieldName, object? min = null, object? max = null)
    {
        var @params = new Dictionary<string, object>();
        if (min != null) @params["min"] = min;
        if (max != null) @params["max"] = max;

        return new FieldError
        {
            Code = ErrorCodes.VALIDATION_OUT_OF_RANGE,
            Message = (min, max) switch
            {
                (not null, not null) => $"{fieldName} must be between {min} and {max}",
                (not null, null) => $"{fieldName} must be at least {min}",
                (null, not null) => $"{fieldName} must be at most {max}",
                _ => $"{fieldName} is out of range"
            },
            Params = @params.Count > 0 ? @params : null
        };
    }
}
