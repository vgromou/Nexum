using System.Security.Claims;
using Api.Common.Errors;
using Api.Exceptions;
using Api.Filters;
using AwesomeAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;

namespace Api.Tests.Filters;

public class EnforceMustChangePasswordAttributeTests
{
    private readonly EnforceMustChangePasswordAttribute _filter;

    public EnforceMustChangePasswordAttributeTests()
    {
        _filter = new EnforceMustChangePasswordAttribute();
    }

    private static ActionExecutingContext CreateContext(
        ClaimsPrincipal? user = null,
        string method = "GET",
        string path = "/api/test",
        bool hasAllowAttribute = false)
    {
        var httpContext = new DefaultHttpContext();
        if (user != null)
        {
            httpContext.User = user;
        }

        httpContext.Request.Method = method;
        httpContext.Request.Path = path;

        var actionContext = new ActionContext(
            httpContext,
            new RouteData(),
            new ActionDescriptor());

        var metadata = new List<object>();
        if (hasAllowAttribute)
        {
            metadata.Add(new AllowMustChangePasswordAttribute());
        }

        var actionDescriptor = new ActionDescriptor
        {
            EndpointMetadata = metadata
        };

        return new ActionExecutingContext(
            new ActionContext(httpContext, new RouteData(), actionDescriptor),
            new List<IFilterMetadata>(),
            new Dictionary<string, object?>(),
            new object());
    }

    private static ClaimsPrincipal CreateAuthenticatedUser(string? mustChangePassword = null)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new(ClaimTypes.Email, "test@example.com")
        };

        if (mustChangePassword != null)
        {
            claims.Add(new Claim("must_change_password", mustChangePassword));
        }

        var identity = new ClaimsIdentity(claims, "TestAuth");
        return new ClaimsPrincipal(identity);
    }

    [Fact]
    public async Task OnActionExecutionAsync_ShouldAllowUnauthenticatedRequests()
    {
        // Arrange
        var context = CreateContext();
        var executionCalled = false;
        Task<ActionExecutedContext> Next()
        {
            executionCalled = true;
            return Task.FromResult(new ActionExecutedContext(
                context,
                new List<IFilterMetadata>(),
                new object()));
        }

        // Act
        await _filter.OnActionExecutionAsync(context, Next);

        // Assert
        executionCalled.Should().BeTrue();
    }

    [Fact]
    public async Task OnActionExecutionAsync_ShouldAllowWhenMustChangePasswordIsFalse()
    {
        // Arrange
        var user = CreateAuthenticatedUser("false");
        var context = CreateContext(user);
        var executionCalled = false;
        Task<ActionExecutedContext> Next()
        {
            executionCalled = true;
            return Task.FromResult(new ActionExecutedContext(
                context,
                new List<IFilterMetadata>(),
                new object()));
        }

        // Act
        await _filter.OnActionExecutionAsync(context, Next);

        // Assert
        executionCalled.Should().BeTrue();
    }

    [Fact]
    public async Task OnActionExecutionAsync_ShouldAllowWhenMustChangePasswordClaimIsMissing()
    {
        // Arrange - User without must_change_password claim
        var user = CreateAuthenticatedUser(null);
        var context = CreateContext(user);
        var executionCalled = false;
        Task<ActionExecutedContext> Next()
        {
            executionCalled = true;
            return Task.FromResult(new ActionExecutedContext(
                context,
                new List<IFilterMetadata>(),
                new object()));
        }

        // Act
        await _filter.OnActionExecutionAsync(context, Next);

        // Assert
        executionCalled.Should().BeTrue();
    }

    [Fact]
    public async Task OnActionExecutionAsync_ShouldBlockWhenMustChangePasswordIsTrue()
    {
        // Arrange
        var user = CreateAuthenticatedUser("true");
        var context = CreateContext(user);
        Task<ActionExecutedContext> Next() => throw new InvalidOperationException("Next should not be called");

        // Act
        var act = async () => await _filter.OnActionExecutionAsync(context, Next);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("You must change your password before continuing");
    }

    [Fact]
    public async Task OnActionExecutionAsync_ShouldThrowPasswordChangeRequiredErrorCode()
    {
        // Arrange
        var user = CreateAuthenticatedUser("true");
        var context = CreateContext(user);
        Task<ActionExecutedContext> Next() => throw new InvalidOperationException("Next should not be called");

        // Act
        try
        {
            await _filter.OnActionExecutionAsync(context, Next);
            Assert.Fail("Expected ForbiddenException to be thrown");
        }
        catch (ForbiddenException ex)
        {
            // Assert
            ex.ErrorCode.Should().Be(ErrorCodes.PASSWORD_CHANGE_REQUIRED);
        }
    }

    [Theory]
    [InlineData("true")]
    [InlineData("True")]
    [InlineData("TRUE")]
    public async Task OnActionExecutionAsync_ShouldHandleDifferentCaseVariations(string claimValue)
    {
        // Arrange
        var user = CreateAuthenticatedUser(claimValue);
        var context = CreateContext(user);
        Task<ActionExecutedContext> Next() => throw new InvalidOperationException("Next should not be called");

        // Act
        var act = async () => await _filter.OnActionExecutionAsync(context, Next);

        // Assert - Should block regardless of case
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task OnActionExecutionAsync_ShouldAllowWhenActionHasAllowAttribute()
    {
        // Arrange
        var user = CreateAuthenticatedUser("true");
        var context = CreateContext(user, hasAllowAttribute: true);
        var executionCalled = false;
        Task<ActionExecutedContext> Next()
        {
            executionCalled = true;
            return Task.FromResult(new ActionExecutedContext(
                context,
                new List<IFilterMetadata>(),
                new object()));
        }

        // Act
        await _filter.OnActionExecutionAsync(context, Next);

        // Assert
        executionCalled.Should().BeTrue();
    }

    [Theory]
    [InlineData("POST", "/api/auth/change-password")]
    [InlineData("POST", "/api/auth/logout")]
    [InlineData("POST", "/api/auth/refresh")]
    [InlineData("GET", "/api/me")]
    public async Task OnActionExecutionAsync_ShouldAllowWhitelistedEndpoints(string method, string path)
    {
        // Arrange
        var user = CreateAuthenticatedUser("true");
        var context = CreateContext(user, method, path);
        var executionCalled = false;
        Task<ActionExecutedContext> Next()
        {
            executionCalled = true;
            return Task.FromResult(new ActionExecutedContext(
                context,
                new List<IFilterMetadata>(),
                new object()));
        }

        // Act
        await _filter.OnActionExecutionAsync(context, Next);

        // Assert
        executionCalled.Should().BeTrue();
    }

    [Theory]
    [InlineData("GET", "/api/auth/change-password")]  // Wrong method
    [InlineData("POST", "/api/auth/login")]  // Not whitelisted
    [InlineData("GET", "/api/users")]  // Not whitelisted
    [InlineData("POST", "/api/organizations")]  // Not whitelisted
    public async Task OnActionExecutionAsync_ShouldBlockNonWhitelistedEndpoints(string method, string path)
    {
        // Arrange
        var user = CreateAuthenticatedUser("true");
        var context = CreateContext(user, method, path);
        Task<ActionExecutedContext> Next() => throw new InvalidOperationException("Next should not be called");

        // Act
        var act = async () => await _filter.OnActionExecutionAsync(context, Next);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task OnActionExecutionAsync_ShouldBeCaseInsensitiveForEndpointMatching()
    {
        // Arrange
        var user = CreateAuthenticatedUser("true");
        var context = CreateContext(user, "post", "/api/auth/change-password");  // lowercase method
        var executionCalled = false;
        Task<ActionExecutedContext> Next()
        {
            executionCalled = true;
            return Task.FromResult(new ActionExecutedContext(
                context,
                new List<IFilterMetadata>(),
                new object()));
        }

        // Act
        await _filter.OnActionExecutionAsync(context, Next);

        // Assert
        executionCalled.Should().BeTrue();
    }
}
