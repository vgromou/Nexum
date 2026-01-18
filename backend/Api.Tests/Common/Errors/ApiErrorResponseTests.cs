using Api.Common.Errors;
using FluentAssertions;

namespace Api.Tests.Common.Errors;

public class ApiErrorResponseTests
{
    [Fact]
    public void FromError_ShouldWrapApiErrorCorrectly()
    {
        // Arrange
        var error = new ApiError
        {
            Status = 400,
            Code = ErrorCodes.VALIDATION_ERROR,
            Message = "Validation failed",
            DisplayType = DisplayType.Field,
            Timestamp = DateTime.UtcNow,
            TraceId = "test-trace-id"
        };

        // Act
        var response = ApiErrorResponse.FromError(error);

        // Assert
        response.Error.Should().BeSameAs(error);
    }
}
