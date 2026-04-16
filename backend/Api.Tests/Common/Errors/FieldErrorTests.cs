using Api.Common.Errors;
using AwesomeAssertions;

namespace Api.Tests.Common.Errors;

public class FieldErrorTests
{
    [Fact]
    public void Required_ShouldCreateFieldErrorWithCorrectCode()
    {
        // Act
        var error = FieldError.Required("Email");

        // Assert
        error.Code.Should().Be(ErrorCodes.VALIDATION_REQUIRED);
        error.Message.Should().Be("Email is required");
        error.Params.Should().BeNull();
    }

    [Fact]
    public void InvalidFormat_WithoutExpectedFormat_ShouldCreateBasicMessage()
    {
        // Act
        var error = FieldError.InvalidFormat("Phone");

        // Assert
        error.Code.Should().Be(ErrorCodes.VALIDATION_INVALID_FORMAT);
        error.Message.Should().Be("Phone has invalid format");
    }

    [Fact]
    public void InvalidFormat_WithExpectedFormat_ShouldIncludeFormatInMessage()
    {
        // Act
        var error = FieldError.InvalidFormat("Phone", "+1-XXX-XXX-XXXX");

        // Assert
        error.Code.Should().Be(ErrorCodes.VALIDATION_INVALID_FORMAT);
        error.Message.Should().Be("Phone has invalid format. Expected: +1-XXX-XXX-XXXX");
    }

    [Fact]
    public void MinLength_ShouldIncludeMinLengthInParams()
    {
        // Act
        var error = FieldError.MinLength("Password", 8);

        // Assert
        error.Code.Should().Be(ErrorCodes.VALIDATION_MIN_LENGTH);
        error.Message.Should().Be("Password must be at least 8 characters");
        error.Params.Should().ContainKey("minLength");
        error.Params!["minLength"].Should().Be(8);
    }

    [Fact]
    public void MaxLength_ShouldIncludeMaxLengthInParams()
    {
        // Act
        var error = FieldError.MaxLength("Username", 20);

        // Assert
        error.Code.Should().Be(ErrorCodes.VALIDATION_MAX_LENGTH);
        error.Message.Should().Be("Username must not exceed 20 characters");
        error.Params.Should().ContainKey("maxLength");
        error.Params!["maxLength"].Should().Be(20);
    }

    [Fact]
    public void InvalidEmail_ShouldCreateCorrectError()
    {
        // Act
        var error = FieldError.InvalidEmail();

        // Assert
        error.Code.Should().Be(ErrorCodes.VALIDATION_INVALID_EMAIL);
        error.Message.Should().Be("Invalid email format");
    }

    [Theory]
    [InlineData(1, 10, "Age must be between 1 and 10")]
    [InlineData(0, null, "Age must be at least 0")]
    [InlineData(null, 100, "Age must be at most 100")]
    [InlineData(null, null, "Age is out of range")]
    public void OutOfRange_ShouldCreateCorrectMessage(int? min, int? max, string expectedMessage)
    {
        // Act
        var error = FieldError.OutOfRange("Age", min, max);

        // Assert
        error.Code.Should().Be(ErrorCodes.VALIDATION_OUT_OF_RANGE);
        error.Message.Should().Be(expectedMessage);
    }

    [Fact]
    public void OutOfRange_WithBothLimits_ShouldIncludeParamsForBoth()
    {
        // Act
        var error = FieldError.OutOfRange("Score", 0, 100);

        // Assert
        error.Params.Should().ContainKey("min");
        error.Params.Should().ContainKey("max");
        error.Params!["min"].Should().Be(0);
        error.Params!["max"].Should().Be(100);
    }
}
