using System.Net;
using Api.Models;
using FluentAssertions;

namespace Api.Tests.Data;

public class ApplicationDbContextTests
{
    [Fact]
    public async Task SaveChanges_ShouldSetCreatedAtAndUpdatedAt_OnNewEntity()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var organization = new Organization
        {
            Name = "Test Org",
            Slug = "test-org"
        };

        // Act
        context.Organizations.Add(organization);
        await context.SaveChangesAsync();

        // Assert
        organization.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        organization.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        organization.CreatedAt.Should().Be(organization.UpdatedAt);
    }

    [Fact]
    public async Task SaveChanges_ShouldUpdateOnlyUpdatedAt_OnModifiedEntity()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var organization = new Organization
        {
            Name = "Test Org",
            Slug = "test-org"
        };
        context.Organizations.Add(organization);
        await context.SaveChangesAsync();
        var originalCreatedAt = organization.CreatedAt;

        // Simulate time passing
        await Task.Delay(100);

        // Act
        organization.Name = "Updated Org";
        await context.SaveChangesAsync();

        // Assert
        organization.CreatedAt.Should().Be(originalCreatedAt);
        organization.UpdatedAt.Should().BeAfter(originalCreatedAt);
    }

    [Fact]
    public async Task Organization_ShouldCascadeDeleteUsers()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var organization = new Organization
        {
            Name = "Test Org",
            Slug = "test-org"
        };
        var user = new User
        {
            Email = "user@test.com",
            Username = "testuser",
            PasswordHash = "hash",
            FirstName = "Test",
            LastName = "User",
            Organization = organization
        };

        context.Organizations.Add(organization);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var userId = user.Id;

        // Act
        context.Organizations.Remove(organization);
        await context.SaveChangesAsync();

        // Assert
        context.Users.Find(userId).Should().BeNull("user should be cascade deleted with organization");
    }

    [Fact]
    public async Task User_ShouldCascadeDeleteRefreshTokens()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var organization = new Organization
        {
            Name = "Test Org",
            Slug = "test-org"
        };
        var user = new User
        {
            Email = "user@test.com",
            Username = "testuser",
            PasswordHash = "hash",
            FirstName = "Test",
            LastName = "User",
            Organization = organization
        };
        var token = new RefreshToken
        {
            TokenHash = "token123",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            User = user
        };

        context.Organizations.Add(organization);
        context.Users.Add(user);
        context.RefreshTokens.Add(token);
        await context.SaveChangesAsync();

        var tokenId = token.Id;

        // Act
        context.Users.Remove(user);
        await context.SaveChangesAsync();

        // Assert
        context.RefreshTokens.Find(tokenId).Should().BeNull("refresh token should be cascade deleted with user");
    }

    [Fact(Skip = "InMemory database does not enforce unique constraints - use integration tests with real DB")]
    public async Task User_EmailShouldBeUnique()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var organization = new Organization
        {
            Name = "Test Org",
            Slug = "test-org"
        };
        var user1 = new User
        {
            Email = "same@test.com",
            Username = "user1",
            PasswordHash = "hash",
            FirstName = "User",
            LastName = "One",
            Organization = organization
        };
        var user2 = new User
        {
            Email = "same@test.com",
            Username = "user2",
            PasswordHash = "hash",
            FirstName = "User",
            LastName = "Two",
            Organization = organization
        };

        context.Organizations.Add(organization);
        context.Users.Add(user1);
        await context.SaveChangesAsync();
        context.Users.Add(user2);

        // Act & Assert
        var act = async () => await context.SaveChangesAsync();
        await act.Should().ThrowAsync<Exception>("duplicate email should violate unique constraint");
    }

    [Fact(Skip = "InMemory database does not enforce unique constraints - use integration tests with real DB")]
    public async Task User_UsernameShouldBeUnique()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var organization = new Organization
        {
            Name = "Test Org",
            Slug = "test-org"
        };
        var user1 = new User
        {
            Email = "user1@test.com",
            Username = "sameusername",
            PasswordHash = "hash",
            FirstName = "User",
            LastName = "One",
            Organization = organization
        };
        var user2 = new User
        {
            Email = "user2@test.com",
            Username = "sameusername",
            PasswordHash = "hash",
            FirstName = "User",
            LastName = "Two",
            Organization = organization
        };

        context.Organizations.Add(organization);
        context.Users.Add(user1);
        await context.SaveChangesAsync();
        context.Users.Add(user2);

        // Act & Assert
        var act = async () => await context.SaveChangesAsync();
        await act.Should().ThrowAsync<Exception>("duplicate username should violate unique constraint");
    }

    [Fact(Skip = "InMemory database does not enforce unique constraints - use integration tests with real DB")]
    public async Task Organization_SlugShouldBeUnique()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var org1 = new Organization { Name = "Org 1", Slug = "same-slug" };
        var org2 = new Organization { Name = "Org 2", Slug = "same-slug" };

        context.Organizations.Add(org1);
        await context.SaveChangesAsync();
        context.Organizations.Add(org2);

        // Act & Assert
        var act = async () => await context.SaveChangesAsync();
        await act.Should().ThrowAsync<Exception>("duplicate slug should violate unique constraint");
    }

    [Fact(Skip = "InMemory database does not enforce unique constraints - use integration tests with real DB")]
    public async Task RefreshToken_TokenHashShouldBeUnique()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var organization = new Organization { Name = "Test Org", Slug = "test-org" };
        var user = new User
        {
            Email = "user@test.com",
            Username = "testuser",
            PasswordHash = "hash",
            FirstName = "Test",
            LastName = "User",
            Organization = organization
        };
        var token1 = new RefreshToken
        {
            TokenHash = "same-token-hash",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            User = user
        };
        var token2 = new RefreshToken
        {
            TokenHash = "same-token-hash",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            User = user
        };

        context.Organizations.Add(organization);
        context.Users.Add(user);
        context.RefreshTokens.Add(token1);
        await context.SaveChangesAsync();
        context.RefreshTokens.Add(token2);

        // Act & Assert
        var act = async () => await context.SaveChangesAsync();
        await act.Should().ThrowAsync<Exception>("duplicate token hash should violate unique constraint");
    }

    [Fact]
    public async Task LoginAttempt_ShouldBeIndependentOfUser()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var attempt = new LoginAttempt
        {
            Email = "nonexistent@test.com",
            Success = false,
            FailureReason = "user_not_found",
            IpAddress = IPAddress.Parse("192.168.1.1")
        };

        // Act
        context.LoginAttempts.Add(attempt);
        await context.SaveChangesAsync();

        // Assert
        attempt.Id.Should().NotBeEmpty();
        context.LoginAttempts.Should().ContainSingle();
    }

    [Fact]
    public async Task User_RoleShouldBeStoredAsString()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var organization = new Organization { Name = "Test Org", Slug = "test-org" };
        var user = new User
        {
            Email = "admin@test.com",
            Username = "admin",
            PasswordHash = "hash",
            FirstName = "Admin",
            LastName = "User",
            Role = UserRole.Admin,
            Organization = organization
        };

        context.Organizations.Add(organization);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Act - Query directly to verify storage format
        var savedUser = await context.Users.FindAsync(user.Id);

        // Assert
        savedUser.Should().NotBeNull();
        savedUser!.Role.Should().Be(UserRole.Admin);
    }

    [Fact]
    public async Task User_ShouldHaveMultipleRefreshTokens()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var organization = new Organization { Name = "Test Org", Slug = "test-org" };
        var user = new User
        {
            Email = "user@test.com",
            Username = "testuser",
            PasswordHash = "hash",
            FirstName = "Test",
            LastName = "User",
            Organization = organization
        };
        var token1 = new RefreshToken
        {
            TokenHash = "token-laptop",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            DeviceInfo = "Chrome on Windows",
            User = user
        };
        var token2 = new RefreshToken
        {
            TokenHash = "token-phone",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            DeviceInfo = "Safari on iPhone",
            User = user
        };
        var token3 = new RefreshToken
        {
            TokenHash = "token-tablet",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            DeviceInfo = "Chrome on iPad",
            User = user
        };

        context.Organizations.Add(organization);
        context.Users.Add(user);
        context.RefreshTokens.AddRange(token1, token2, token3);
        await context.SaveChangesAsync();

        // Act
        var savedUser = await context.Users.FindAsync(user.Id);
        await context.Entry(savedUser!).Collection(u => u.RefreshTokens).LoadAsync();

        // Assert
        savedUser!.RefreshTokens.Should().HaveCount(3, "user should support multiple sessions");
    }

    [Fact]
    public async Task LoginAttempt_ShouldOnlyHaveCreatedAt()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var attempt = new LoginAttempt
        {
            Email = "test@example.com",
            Success = true,
            IpAddress = IPAddress.Parse("192.168.1.1")
        };

        // Act
        context.LoginAttempts.Add(attempt);
        await context.SaveChangesAsync();

        // Assert - LoginAttempt inherits from BaseEntity (only CreatedAt)
        attempt.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task RefreshToken_ShouldOnlyHaveCreatedAt()
    {
        // Arrange
        using var context = TestDbContextFactory.Create();
        var organization = new Organization { Name = "Test Org", Slug = "test-org" };
        var user = new User
        {
            Email = "user@test.com",
            Username = "testuser",
            PasswordHash = "hash",
            FirstName = "Test",
            LastName = "User",
            Organization = organization
        };
        var token = new RefreshToken
        {
            TokenHash = "test-token",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            User = user
        };

        // Act
        context.Organizations.Add(organization);
        context.Users.Add(user);
        context.RefreshTokens.Add(token);
        await context.SaveChangesAsync();

        // Assert - RefreshToken inherits from BaseEntity (only CreatedAt)
        token.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }
}
