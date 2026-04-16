using Api.Exceptions;

namespace Api.Common.Errors;

/// <summary>
/// Extension methods for validation error handling.
/// </summary>
public static class ValidationExtensions
{
    /// <summary>
    /// Converts a dictionary of validation errors to a ValidationException.
    /// </summary>
    public static ValidationException ToValidationException(
        this Dictionary<string, List<FieldError>> fieldErrors,
        string message = "Please check the form fields")
    {
        return new ValidationException(message, fieldErrors);
    }

    /// <summary>
    /// Creates a ValidationException from ModelState errors.
    /// </summary>
    public static ValidationException ToValidationException(
        this Microsoft.AspNetCore.Mvc.ModelBinding.ModelStateDictionary modelState)
    {
        var fieldErrors = new Dictionary<string, List<FieldError>>();

        foreach (var (key, value) in modelState)
        {
            if (value.Errors.Count == 0) continue;

            var errors = value.Errors.Select(e => new FieldError
            {
                Code = ErrorCodes.VALIDATION_ERROR,
                Message = string.IsNullOrEmpty(e.ErrorMessage)
                    ? e.Exception?.Message ?? "Invalid value"
                    : e.ErrorMessage
            }).ToList();

            fieldErrors[ToCamelCase(key)] = errors;
        }

        return new ValidationException("Please check the form fields", fieldErrors);
    }

    /// <summary>
    /// Creates a builder for constructing field errors.
    /// </summary>
    public static ValidationErrorBuilder CreateValidation()
    {
        return new ValidationErrorBuilder();
    }

    private static string ToCamelCase(string str)
    {
        if (string.IsNullOrEmpty(str)) return str;
        if (str.Length == 1) return str.ToLower();
        return char.ToLower(str[0]) + str[1..];
    }
}

/// <summary>
/// Builder for constructing validation errors fluently.
/// </summary>
public class ValidationErrorBuilder
{
    private readonly Dictionary<string, List<FieldError>> _errors = new();

    /// <summary>
    /// Adds a field error.
    /// </summary>
    public ValidationErrorBuilder AddError(string fieldName, FieldError error)
    {
        if (!_errors.TryGetValue(fieldName, out var list))
        {
            list = [];
            _errors[fieldName] = list;
        }
        list.Add(error);
        return this;
    }

    /// <summary>
    /// Adds a field error with code and message.
    /// </summary>
    public ValidationErrorBuilder AddError(string fieldName, string code, string message)
    {
        return AddError(fieldName, new FieldError { Code = code, Message = message });
    }

    /// <summary>
    /// Adds a required field error.
    /// </summary>
    public ValidationErrorBuilder AddRequired(string fieldName)
    {
        return AddError(fieldName, FieldError.Required(fieldName));
    }

    /// <summary>
    /// Adds an invalid format error.
    /// </summary>
    public ValidationErrorBuilder AddInvalidFormat(string fieldName, string? expectedFormat = null)
    {
        return AddError(fieldName, FieldError.InvalidFormat(fieldName, expectedFormat));
    }

    /// <summary>
    /// Adds a min length error.
    /// </summary>
    public ValidationErrorBuilder AddMinLength(string fieldName, int minLength)
    {
        return AddError(fieldName, FieldError.MinLength(fieldName, minLength));
    }

    /// <summary>
    /// Adds a max length error.
    /// </summary>
    public ValidationErrorBuilder AddMaxLength(string fieldName, int maxLength)
    {
        return AddError(fieldName, FieldError.MaxLength(fieldName, maxLength));
    }

    /// <summary>
    /// Adds an invalid email error.
    /// </summary>
    public ValidationErrorBuilder AddInvalidEmail(string fieldName = "email")
    {
        return AddError(fieldName, FieldError.InvalidEmail());
    }

    /// <summary>
    /// Returns whether any errors have been added.
    /// </summary>
    public bool HasErrors => _errors.Count > 0;

    /// <summary>
    /// Builds the field errors dictionary.
    /// </summary>
    public Dictionary<string, List<FieldError>> Build() => _errors;

    /// <summary>
    /// Throws ValidationException if there are errors.
    /// </summary>
    public void ThrowIfErrors(string message = "Please check the form fields")
    {
        if (HasErrors)
        {
            throw new ValidationException(message, _errors);
        }
    }

    /// <summary>
    /// Builds and returns a ValidationException.
    /// </summary>
    public ValidationException ToException(string message = "Please check the form fields")
    {
        return new ValidationException(message, _errors);
    }
}
