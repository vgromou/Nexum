using Api.Common.Errors;
using Api.Exceptions;
using AwesomeAssertions;

namespace Api.Tests.Exceptions;

public class ValidationExceptionTests
{
    [Fact]
    public void Constructor_WithFieldErrors_ShouldSetCorrectProperties()
    {
        // Arrange
        var fieldErrors = new Dictionary<string, List<FieldError>>
        {
            ["email"] = new() { FieldError.InvalidEmail() }
        };

        // Act
        var exception = new ValidationException("Validation failed", fieldErrors);

        // Assert
        exception.StatusCode.Should().Be(400);
        exception.ErrorCode.Should().Be(ErrorCodes.VALIDATION_ERROR);
        exception.DisplayType.Should().Be(DisplayType.Field);
        exception.FieldErrors.Should().BeSameAs(fieldErrors);
        exception.Details.Should().NotBeNull();
        exception.Details!.Fields.Should().BeSameAs(fieldErrors);
    }

    [Fact]
    public void Constructor_WithMessageOnly_ShouldCreateEmptyFieldErrors()
    {
        // Act
        var exception = new ValidationException("Validation failed");

        // Assert
        exception.FieldErrors.Should().BeEmpty();
    }

    [Fact]
    public void ForField_ShouldCreateSingleFieldError()
    {
        // Act
        var exception = ValidationException.ForField("username", FieldError.Required("Username"));

        // Assert
        exception.FieldErrors.Should().ContainKey("username");
        exception.FieldErrors["username"].Should().HaveCount(1);
        exception.FieldErrors["username"][0].Code.Should().Be(ErrorCodes.VALIDATION_REQUIRED);
    }

    [Fact]
    public void ForField_WithCodeAndMessage_ShouldCreateError()
    {
        // Act
        var exception = ValidationException.ForField(
            "email",
            ErrorCodes.VALIDATION_INVALID_EMAIL,
            "Invalid email");

        // Assert
        exception.FieldErrors["email"][0].Code.Should().Be(ErrorCodes.VALIDATION_INVALID_EMAIL);
        exception.FieldErrors["email"][0].Message.Should().Be("Invalid email");
    }

    [Fact]
    public void Required_ShouldCreateRequiredFieldError()
    {
        // Act
        var exception = ValidationException.Required("Password");

        // Assert
        exception.FieldErrors.Should().ContainKey("Password");
        exception.FieldErrors["Password"][0].Code.Should().Be(ErrorCodes.VALIDATION_REQUIRED);
        exception.FieldErrors["Password"][0].Message.Should().Contain("Password");
    }

    [Fact]
    public void ToApiErrorResponse_ShouldIncludeFieldErrors()
    {
        // Arrange
        var fieldErrors = new Dictionary<string, List<FieldError>>
        {
            ["field1"] = new() { FieldError.Required("Field1") },
            ["field2"] = new() { FieldError.MinLength("Field2", 5) }
        };
        var exception = new ValidationException("Check fields", fieldErrors);
        var timestamp = DateTime.UtcNow;

        // Act
        var response = exception.ToApiErrorResponse("trace-id", timestamp);

        // Assert
        response.Error.Details.Should().NotBeNull();
        response.Error.Details!.Fields.Should().HaveCount(2);
        response.Error.Timestamp.Should().Be(timestamp);
    }
}
