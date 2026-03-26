using System.Net;
using Api.Models;
using FluentAssertions;

namespace Api.Tests.Models;

public class LoginAttemptTests
{
    [Fact]
    public void LoginAttempt_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var attempt = new LoginAttempt();

        // Assert
        attempt.LoginIdentifier.Should().BeEmpty();
        attempt.Success.Should().BeFalse();
        attempt.FailureReason.Should().BeNull();
        attempt.UserAgent.Should().BeNull();
    }

    [Fact]
    public void LoginAttempt_ShouldSetProperties()
    {
        // Arrange
        var ipAddress = IPAddress.Parse("10.0.0.1");

        // Act
        var attempt = new LoginAttempt
        {
            Id = Guid.NewGuid(),
            LoginIdentifier = "user@example.com",
            IpAddress = ipAddress,
            Success = true,
            UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        };

        // Assert
        attempt.LoginIdentifier.Should().Be("user@example.com");
        attempt.IpAddress.Should().Be(ipAddress);
        attempt.Success.Should().BeTrue();
        attempt.UserAgent.Should().Contain("Mozilla");
    }

    [Fact]
    public void LoginAttempt_SuccessfulAttempt_ShouldHaveNoFailureReason()
    {
        // Arrange & Act
        var attempt = new LoginAttempt
        {
            LoginIdentifier = "user@example.com",
            Success = true,
            FailureReason = null
        };

        // Assert
        attempt.Success.Should().BeTrue();
        attempt.FailureReason.Should().BeNull();
    }

    [Theory]
    [InlineData("invalid_password")]
    [InlineData("user_not_found")]
    [InlineData("account_locked")]
    [InlineData("account_inactive")]
    [InlineData("too_many_attempts")]
    public void LoginAttempt_FailedAttempt_ShouldHaveFailureReason(string reason)
    {
        // Arrange & Act
        var attempt = new LoginAttempt
        {
            LoginIdentifier = "user@example.com",
            Success = false,
            FailureReason = reason
        };

        // Assert
        attempt.Success.Should().BeFalse();
        attempt.FailureReason.Should().Be(reason);
    }

    [Fact]
    public void LoginAttempt_ShouldTrackNonExistentEmail()
    {
        // Arrange & Act
        var attempt = new LoginAttempt
        {
            LoginIdentifier = "nonexistent@example.com",
            Success = false,
            FailureReason = "user_not_found",
            IpAddress = IPAddress.Parse("192.168.1.1")
        };

        // Assert
        attempt.LoginIdentifier.Should().Be("nonexistent@example.com");
        attempt.Success.Should().BeFalse();
        attempt.FailureReason.Should().Be("user_not_found");
    }

    [Fact]
    public void LoginAttempt_ShouldSupportIPv4Address()
    {
        // Arrange & Act
        var attempt = new LoginAttempt
        {
            IpAddress = IPAddress.Parse("203.0.113.50")
        };

        // Assert
        attempt.IpAddress.ToString().Should().Be("203.0.113.50");
    }

    [Fact]
    public void LoginAttempt_ShouldSupportIPv6Address()
    {
        // Arrange & Act
        var attempt = new LoginAttempt
        {
            IpAddress = IPAddress.Parse("2001:db8::1")
        };

        // Assert
        attempt.IpAddress.ToString().Should().Be("2001:db8::1");
    }

    [Fact]
    public void LoginAttempt_ShouldStoreUserAgent()
    {
        // Arrange
        var userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

        // Act
        var attempt = new LoginAttempt
        {
            UserAgent = userAgent
        };

        // Assert
        attempt.UserAgent.Should().Be(userAgent);
    }
}
