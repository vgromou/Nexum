using System.Text.Json;
using Api.Common.Errors;
using Api.Exceptions;
using Api.Middleware;
using AwesomeAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;

namespace Api.Tests.Middleware;

public class ApiExceptionMiddlewareTests
{
    private readonly Mock<ILogger<ApiExceptionMiddleware>> _loggerMock;
    private readonly Mock<IHostEnvironment> _environmentMock;

    public ApiExceptionMiddlewareTests()
    {
        _loggerMock = new Mock<ILogger<ApiExceptionMiddleware>>();
        _environmentMock = new Mock<IHostEnvironment>();
        _environmentMock.Setup(e => e.EnvironmentName).Returns("Production");
    }

    [Fact]
    public async Task InvokeAsync_WhenNoException_ShouldCallNext()
    {
        // Arrange
        var nextCalled = false;
        RequestDelegate next = _ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };
        var middleware = new ApiExceptionMiddleware(next, _loggerMock.Object, _environmentMock.Object);
        var context = new DefaultHttpContext();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        nextCalled.Should().BeTrue();
    }

    [Fact]
    public async Task InvokeAsync_WhenValidationException_ShouldReturn400()
    {
        // Arrange
        var fieldErrors = new Dictionary<string, List<FieldError>>
        {
            ["email"] = new() { FieldError.InvalidEmail() }
        };
        RequestDelegate next = _ => throw new ValidationException("Validation failed", fieldErrors);
        var middleware = new ApiExceptionMiddleware(next, _loggerMock.Object, _environmentMock.Object);
        var context = CreateHttpContext();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(400);
        var response = await GetResponseBody<ApiErrorResponse>(context);
        response.Error.Code.Should().Be(ErrorCodes.VALIDATION_ERROR);
        response.Error.DisplayType.Should().Be(DisplayType.Field);
    }

    [Fact]
    public async Task InvokeAsync_WhenNotFoundException_ShouldReturn404()
    {
        // Arrange
        RequestDelegate next = _ => throw new NotFoundException("User not found");
        var middleware = new ApiExceptionMiddleware(next, _loggerMock.Object, _environmentMock.Object);
        var context = CreateHttpContext();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(404);
        var response = await GetResponseBody<ApiErrorResponse>(context);
        response.Error.Code.Should().Be(ErrorCodes.RESOURCE_NOT_FOUND);
        response.Error.DisplayType.Should().Be(DisplayType.Page);
    }

    [Fact]
    public async Task InvokeAsync_WhenUnexpectedException_ShouldReturn500()
    {
        // Arrange
        RequestDelegate next = _ => throw new InvalidOperationException("Something broke");
        var middleware = new ApiExceptionMiddleware(next, _loggerMock.Object, _environmentMock.Object);
        var context = CreateHttpContext();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(500);
        var response = await GetResponseBody<ApiErrorResponse>(context);
        response.Error.Code.Should().Be(ErrorCodes.SERVER_ERROR);
        response.Error.DisplayType.Should().Be(DisplayType.Toast);
    }

    [Fact]
    public async Task InvokeAsync_WhenUnexpectedException_InProduction_ShouldNotExposeDetails()
    {
        // Arrange
        _environmentMock.Setup(e => e.EnvironmentName).Returns("Production");
        RequestDelegate next = _ => throw new InvalidOperationException("Secret internal error");
        var middleware = new ApiExceptionMiddleware(next, _loggerMock.Object, _environmentMock.Object);
        var context = CreateHttpContext();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var response = await GetResponseBody<ApiErrorResponse>(context);
        response.Error.Message.Should().Be("An unexpected error occurred");
        response.Error.Message.Should().NotContain("Secret");
    }

    [Fact]
    public async Task InvokeAsync_WhenUnexpectedException_InDevelopment_ShouldExposeDetails()
    {
        // Arrange
        _environmentMock.Setup(e => e.EnvironmentName).Returns("Development");
        RequestDelegate next = _ => throw new InvalidOperationException("Detailed error message");
        var middleware = new ApiExceptionMiddleware(next, _loggerMock.Object, _environmentMock.Object);
        var context = CreateHttpContext();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var response = await GetResponseBody<ApiErrorResponse>(context);
        response.Error.Message.Should().Contain("Detailed error message");
    }

    [Fact]
    public async Task InvokeAsync_WhenRateLimitException_ShouldAddRetryAfterHeader()
    {
        // Arrange
        RequestDelegate next = _ => throw new RateLimitException("Too many requests", 60);
        var middleware = new ApiExceptionMiddleware(next, _loggerMock.Object, _environmentMock.Object);
        var context = CreateHttpContext();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(429);
        context.Response.Headers.Should().ContainKey("Retry-After");
        context.Response.Headers["Retry-After"].ToString().Should().Be("60");
    }

    [Fact]
    public async Task InvokeAsync_ShouldSetContentTypeToJson()
    {
        // Arrange
        RequestDelegate next = _ => throw new NotFoundException();
        var middleware = new ApiExceptionMiddleware(next, _loggerMock.Object, _environmentMock.Object);
        var context = CreateHttpContext();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.ContentType.Should().Be("application/json");
    }

    [Fact]
    public async Task InvokeAsync_ShouldIncludeTraceId()
    {
        // Arrange
        RequestDelegate next = _ => throw new NotFoundException();
        var middleware = new ApiExceptionMiddleware(next, _loggerMock.Object, _environmentMock.Object);
        var context = CreateHttpContext();
        context.TraceIdentifier = "test-trace-123";

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var response = await GetResponseBody<ApiErrorResponse>(context);
        response.Error.TraceId.Should().Be("test-trace-123");
    }

    [Fact]
    public async Task InvokeAsync_WhenOperationCancelled_ShouldReturn499()
    {
        // Arrange
        RequestDelegate next = _ => throw new OperationCanceledException();
        var middleware = new ApiExceptionMiddleware(next, _loggerMock.Object, _environmentMock.Object);
        var context = CreateHttpContext();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(499);
        var response = await GetResponseBody<ApiErrorResponse>(context);
        response.Error.Code.Should().Be(ErrorCodes.CLIENT_CLOSED_REQUEST);
        response.Error.DisplayType.Should().Be(DisplayType.None);
    }

    [Fact]
    public async Task InvokeAsync_WhenTaskCancelled_ShouldReturn499()
    {
        // Arrange
        RequestDelegate next = _ => throw new TaskCanceledException();
        var middleware = new ApiExceptionMiddleware(next, _loggerMock.Object, _environmentMock.Object);
        var context = CreateHttpContext();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(499);
        var response = await GetResponseBody<ApiErrorResponse>(context);
        response.Error.Code.Should().Be(ErrorCodes.CLIENT_CLOSED_REQUEST);
    }

    private static DefaultHttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<T> GetResponseBody<T>(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();
        return JsonSerializer.Deserialize<T>(body, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        })!;
    }
}
