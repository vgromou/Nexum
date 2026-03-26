using Api.Common.Errors;

namespace Api.Exceptions;

/// <summary>
/// Exception for validation errors (HTTP 400).
/// DisplayType: field - errors should be shown under form fields.
/// </summary>
public class ValidationException : ApiException
{
    public Dictionary<string, List<FieldError>> FieldErrors { get; }

    public ValidationException(
        string message,
        Dictionary<string, List<FieldError>> fieldErrors)
        : base(
            statusCode: 400,
            errorCode: ErrorCodes.VALIDATION_ERROR,
            message: message,
            displayType: DisplayType.Field,
            details: new ApiErrorDetails { Fields = fieldErrors })
    {
        FieldErrors = fieldErrors;
    }

    public ValidationException(string message)
        : this(message, new Dictionary<string, List<FieldError>>())
    {
    }

    /// <summary>
    /// Creates a ValidationException with a single field error.
    /// </summary>
    public static ValidationException ForField(string fieldName, FieldError error)
    {
        return new ValidationException(
            "Please check the form fields",
            new Dictionary<string, List<FieldError>>
            {
                [fieldName] = [error]
            });
    }

    /// <summary>
    /// Creates a ValidationException with a single field error.
    /// </summary>
    public static ValidationException ForField(string fieldName, string code, string message)
    {
        return ForField(fieldName, new FieldError { Code = code, Message = message });
    }

    /// <summary>
    /// Creates a ValidationException for a required field.
    /// </summary>
    public static ValidationException Required(string fieldName)
    {
        return ForField(fieldName, FieldError.Required(fieldName));
    }
}
