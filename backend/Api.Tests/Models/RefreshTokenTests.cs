using System.Net;
using Api.Models;
using AwesomeAssertions;

namespace Api.Tests.Models;

public class RefreshTokenTests
{
    [Fact]
    public void RefreshToken_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var token = new RefreshToken();

        // Assert
        token.TokenHash.Should().BeEmpty();
        token.RevokedAt.Should().BeNull();
        token.RevokedReason.Should().BeNull();
        token.DeviceInfo.Should().BeNull();
        token.IpAddress.Should().BeNull();
    }

    [Fact]
    public void RefreshToken_ShouldSetProperties()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var expiresAt = DateTime.UtcNow.AddDays(7);
        var ipAddress = IPAddress.Parse("192.168.1.1");

        // Act
        var token = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = "abc123hash",
            ExpiresAt = expiresAt,
            DeviceInfo = "Chrome on Windows",
            IpAddress = ipAddress
        };

        // Assert
        token.UserId.Should().Be(userId);
        token.TokenHash.Should().Be("abc123hash");
        token.ExpiresAt.Should().Be(expiresAt);
        token.DeviceInfo.Should().Be("Chrome on Windows");
        token.IpAddress.Should().Be(ipAddress);
    }

    [Fact]
    public void RefreshToken_IsValidAt_ShouldReturnTrue_WhenNotExpiredAndNotRevoked()
    {
        // Arrange
        var checkTime = new DateTime(2024, 1, 15, 12, 0, 0, DateTimeKind.Utc);
        var token = new RefreshToken
        {
            ExpiresAt = new DateTime(2024, 1, 20, 12, 0, 0, DateTimeKind.Utc),
            RevokedAt = null
        };

        // Act & Assert
        token.IsValidAt(checkTime).Should().BeTrue();
    }

    [Fact]
    public void RefreshToken_IsValidAt_ShouldReturnFalse_WhenExpired()
    {
        // Arrange
        var checkTime = new DateTime(2024, 1, 15, 12, 0, 0, DateTimeKind.Utc);
        var token = new RefreshToken
        {
            ExpiresAt = new DateTime(2024, 1, 10, 12, 0, 0, DateTimeKind.Utc),
            RevokedAt = null
        };

        // Act & Assert
        token.IsValidAt(checkTime).Should().BeFalse("token is expired");
    }

    [Fact]
    public void RefreshToken_IsValidAt_ShouldReturnFalse_WhenRevoked()
    {
        // Arrange
        var checkTime = new DateTime(2024, 1, 15, 12, 0, 0, DateTimeKind.Utc);
        var token = new RefreshToken
        {
            ExpiresAt = new DateTime(2024, 1, 20, 12, 0, 0, DateTimeKind.Utc),
            RevokedAt = new DateTime(2024, 1, 14, 12, 0, 0, DateTimeKind.Utc),
            RevokedReason = "logout"
        };

        // Act & Assert
        token.IsValidAt(checkTime).Should().BeFalse("token is revoked");
    }

    [Fact]
    public void RefreshToken_IsValidAt_ShouldReturnFalse_WhenBothExpiredAndRevoked()
    {
        // Arrange
        var checkTime = new DateTime(2024, 1, 15, 12, 0, 0, DateTimeKind.Utc);
        var token = new RefreshToken
        {
            ExpiresAt = new DateTime(2024, 1, 10, 12, 0, 0, DateTimeKind.Utc),
            RevokedAt = new DateTime(2024, 1, 8, 12, 0, 0, DateTimeKind.Utc),
            RevokedReason = "security"
        };

        // Act & Assert
        token.IsValidAt(checkTime).Should().BeFalse();
    }

    [Fact]
    public void RefreshToken_IsValidAt_ShouldReturnFalse_WhenExpiresAtEqualsCheckTime()
    {
        // Arrange - edge case: expires exactly at check time
        var checkTime = new DateTime(2024, 1, 15, 12, 0, 0, DateTimeKind.Utc);
        var token = new RefreshToken
        {
            ExpiresAt = checkTime,
            RevokedAt = null
        };

        // Act & Assert
        token.IsValidAt(checkTime).Should().BeFalse("token expires at exactly the check time");
    }

    [Fact]
    public void RefreshToken_IsValid_ShouldDelegateToIsValidAt()
    {
        // Arrange - token that won't expire for a long time
        var token = new RefreshToken
        {
            ExpiresAt = DateTime.UtcNow.AddDays(365),
            RevokedAt = null
        };

        // Act & Assert - IsValid should return true for non-expired, non-revoked token
        token.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("logout")]
    [InlineData("security")]
    [InlineData("password_change")]
    [InlineData("admin_revoke")]
    public void RefreshToken_ShouldAcceptVariousRevokeReasons(string reason)
    {
        // Arrange & Act
        var token = new RefreshToken
        {
            RevokedAt = DateTime.UtcNow,
            RevokedReason = reason
        };

        // Assert
        token.RevokedReason.Should().Be(reason);
    }

    [Fact]
    public void RefreshToken_ShouldSupportIPv4Address()
    {
        // Arrange & Act
        var token = new RefreshToken
        {
            IpAddress = IPAddress.Parse("192.168.1.100")
        };

        // Assert
        token.IpAddress.Should().NotBeNull();
        token.IpAddress!.ToString().Should().Be("192.168.1.100");
    }

    [Fact]
    public void RefreshToken_ShouldSupportIPv6Address()
    {
        // Arrange & Act
        var token = new RefreshToken
        {
            IpAddress = IPAddress.Parse("::1")
        };

        // Assert
        token.IpAddress.Should().NotBeNull();
        token.IpAddress!.ToString().Should().Be("::1");
    }
}
