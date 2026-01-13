using Api.Models;
using FluentAssertions;

namespace Api.Tests.Models;

public class UserTests
{
    [Fact]
    public void User_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var user = new User();

        // Assert
        user.Email.Should().BeEmpty();
        user.NormalizedEmail.Should().BeEmpty();
        user.Username.Should().BeEmpty();
        user.PasswordHash.Should().BeEmpty();
        user.FirstName.Should().BeNull();
        user.LastName.Should().BeNull();
        user.Role.Should().Be(UserRole.Member);
        user.Position.Should().BeNull();
        user.DateOfBirth.Should().BeNull();
        user.AvatarUrl.Should().BeNull();
        user.IsActive.Should().BeTrue();
        user.MustChangePassword.Should().BeTrue();
        user.FailedLoginAttempts.Should().Be(0);
        user.LockoutUntil.Should().BeNull();
        user.PasswordChangedAt.Should().BeNull();
        user.RefreshTokens.Should().BeEmpty();
    }

    [Fact]
    public void User_ShouldSetProperties()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var birthDate = new DateOnly(1990, 5, 15);
        var lockoutTime = DateTime.UtcNow.AddMinutes(15);
        var passwordChangedAt = DateTime.UtcNow;

        // Act
        var user = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            Email = "john@example.com",
            Username = "johndoe",
            PasswordHash = "hashed_password",
            FirstName = "John",
            LastName = "Doe",
            Role = UserRole.Admin,
            Position = "Software Engineer",
            DateOfBirth = birthDate,
            AvatarUrl = "https://example.com/avatar.png",
            IsActive = false,
            MustChangePassword = false,
            FailedLoginAttempts = 3,
            LockoutUntil = lockoutTime,
            PasswordChangedAt = passwordChangedAt
        };

        // Assert
        user.OrganizationId.Should().Be(orgId);
        user.Email.Should().Be("john@example.com");
        user.Username.Should().Be("johndoe");
        user.PasswordHash.Should().Be("hashed_password");
        user.FirstName.Should().Be("John");
        user.LastName.Should().Be("Doe");
        user.Role.Should().Be(UserRole.Admin);
        user.Position.Should().Be("Software Engineer");
        user.DateOfBirth.Should().Be(birthDate);
        user.AvatarUrl.Should().Be("https://example.com/avatar.png");
        user.IsActive.Should().BeFalse();
        user.MustChangePassword.Should().BeFalse();
        user.FailedLoginAttempts.Should().Be(3);
        user.LockoutUntil.Should().Be(lockoutTime);
        user.PasswordChangedAt.Should().Be(passwordChangedAt);
    }

    [Theory]
    [InlineData(UserRole.Member)]
    [InlineData(UserRole.Admin)]
    [InlineData(UserRole.Owner)]
    public void User_ShouldAcceptAllRoleValues(UserRole role)
    {
        // Arrange & Act
        var user = new User { Role = role };

        // Assert
        user.Role.Should().Be(role);
    }

    [Fact]
    public void User_ShouldInitializeRefreshTokensCollection()
    {
        // Arrange
        var user = new User();

        // Act & Assert
        user.RefreshTokens.Should().NotBeNull();
        user.RefreshTokens.Should().BeAssignableTo<ICollection<RefreshToken>>();
    }

    [Fact]
    public void User_NewUser_ShouldRequirePasswordChange()
    {
        // Arrange & Act
        var user = new User();

        // Assert
        user.MustChangePassword.Should().BeTrue("new users should be required to change password");
    }

    [Fact]
    public void User_NewUser_ShouldBeActive()
    {
        // Arrange & Act
        var user = new User();

        // Assert
        user.IsActive.Should().BeTrue("new users should be active by default");
    }

    [Fact]
    public void User_NewUser_ShouldHaveZeroFailedAttempts()
    {
        // Arrange & Act
        var user = new User();

        // Assert
        user.FailedLoginAttempts.Should().Be(0, "new users should have zero failed login attempts");
    }
}
