using Api.Common.Errors;
using Api.Exceptions;
using AwesomeAssertions;

namespace Api.Tests.Exceptions;

public class ApiExceptionTests
{
    [Fact]
    public void Constructor_ShouldSetAllProperties()
    {
        // Arrange
        var details = new ApiErrorDetails
        {
            Context = new Dictionary<string, object> { ["key"] = "value" }
        };

        // Act
        var exception = new ApiException(
            statusCode: 500,
            errorCode: ErrorCodes.SERVER_ERROR,
            message: "Something went wrong",
            displayType: DisplayType.Toast,
            details: details);

        // Assert
        exception.StatusCode.Should().Be(500);
        exception.ErrorCode.Should().Be(ErrorCodes.SERVER_ERROR);
        exception.Message.Should().Be("Something went wrong");
        exception.DisplayType.Should().Be(DisplayType.Toast);
        exception.Details.Should().BeSameAs(details);
    }

    [Fact]
    public void Constructor_DefaultDisplayType_ShouldBeToast()
    {
        // Act
        var exception = new ApiException(500, "CODE", "message");

        // Assert
        exception.DisplayType.Should().Be(DisplayType.Toast);
    }

    [Fact]
    public void ToApiError_ShouldCreateCorrectApiError()
    {
        // Arrange
        var exception = new ApiException(
            statusCode: 400,
            errorCode: ErrorCodes.VALIDATION_ERROR,
            message: "Invalid input",
            displayType: DisplayType.Field);
        var traceId = "trace-123";
        var timestamp = new DateTime(2025, 1, 15, 12, 0, 0, DateTimeKind.Utc);

        // Act
        var error = exception.ToApiError(traceId, timestamp);

        // Assert
        error.Status.Should().Be(400);
        error.Code.Should().Be(ErrorCodes.VALIDATION_ERROR);
        error.Message.Should().Be("Invalid input");
        error.DisplayType.Should().Be(DisplayType.Field);
        error.TraceId.Should().Be(traceId);
        error.Timestamp.Should().Be(timestamp);
    }

    [Fact]
    public void ToApiErrorResponse_ShouldWrapApiError()
    {
        // Arrange
        var exception = new ApiException(404, ErrorCodes.RESOURCE_NOT_FOUND, "Not found");
        var traceId = "trace-456";
        var timestamp = DateTime.UtcNow;

        // Act
        var response = exception.ToApiErrorResponse(traceId, timestamp);

        // Assert
        response.Error.Should().NotBeNull();
        response.Error.Status.Should().Be(404);
        response.Error.TraceId.Should().Be(traceId);
        response.Error.Timestamp.Should().Be(timestamp);
    }

    [Fact]
    public void Constructor_WithInnerException_ShouldPreserveIt()
    {
        // Arrange
        var inner = new InvalidOperationException("Inner error");

        // Act
        var exception = new ApiException(
            500,
            ErrorCodes.SERVER_ERROR,
            "Outer error",
            innerException: inner);

        // Assert
        exception.InnerException.Should().BeSameAs(inner);
    }
}
