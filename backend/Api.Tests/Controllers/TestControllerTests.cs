#if DEBUG
using Api.Controllers;
using Api.Data;
using Api.DTOs.Auth;
using Api.Exceptions;
using Api.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;

namespace Api.Tests.Controllers;

public class TestControllerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly FakeTimeProvider _timeProvider;
    private readonly TestController _controller;

    public TestControllerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _timeProvider = new FakeTimeProvider(DateTimeOffset.UtcNow);
        _controller = new TestController(_context, _timeProvider);
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    private async Task<Organization> CreateOrganizationAsync()
    {
        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test Organization",
            Slug = "test-org",
            CreatedAt = _timeProvider.GetUtcNow().UtcDateTime,
            UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime
        };
        _context.Organizations.Add(organization);
        await _context.SaveChangesAsync();
        return organization;
    }

    private async Task<User> CreateAdminUserAsync(Guid organizationId)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@localhost",
            Username = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin"),
            FirstName = "Admin",
            LastName = "User",
            IsActive = true,
            MustChangePassword = false,
            CreatedAt = _timeProvider.GetUtcNow().UtcDateTime,
            UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime
        };
        _context.Users.Add(user);

        var membership = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            OrganizationId = organizationId,
            OrganizationRole = OrganizationRole.Admin,
            JoinedAt = _timeProvider.GetUtcNow().UtcDateTime,
            CreatedAt = _timeProvider.GetUtcNow().UtcDateTime,
            UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime
        };
        _context.OrganizationMembers.Add(membership);
        await _context.SaveChangesAsync();

        return user;
    }

    #region SeedAdmin Tests

    [Fact]
    public async Task SeedAdmin_WithOrganization_ReturnsCreatedResult()
    {
        // Arrange
        await CreateOrganizationAsync();

        // Act
        var result = await _controller.SeedAdmin(CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(201);
    }

    [Fact]
    public async Task SeedAdmin_WithOrganization_ReturnsCorrectUserData()
    {
        // Arrange
        await CreateOrganizationAsync();

        // Act
        var result = await _controller.SeedAdmin(CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<LoginUserResponse>().Subject;

        response.Email.Should().Be("admin@localhost");
        response.Username.Should().Be("admin");
        response.FirstName.Should().Be("Admin");
        response.LastName.Should().Be("User");
        response.OrganizationRole.Should().Be(OrganizationRole.Admin);
        response.IsActive.Should().BeTrue();
        response.MustChangePassword.Should().BeFalse();
    }

    [Fact]
    public async Task SeedAdmin_WithOrganization_CreatesUserInDatabase()
    {
        // Arrange
        await CreateOrganizationAsync();

        // Act
        await _controller.SeedAdmin(CancellationToken.None);

        // Assert
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
        user.Should().NotBeNull();
        user!.Email.Should().Be("admin@localhost");
        user.FirstName.Should().Be("Admin");
        user.LastName.Should().Be("User");
    }

    [Fact]
    public async Task SeedAdmin_WithOrganization_CreatesOrganizationMembership()
    {
        // Arrange
        var org = await CreateOrganizationAsync();

        // Act
        await _controller.SeedAdmin(CancellationToken.None);

        // Assert
        var membership = await _context.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == org.Id);
        membership.Should().NotBeNull();
        membership!.OrganizationRole.Should().Be(OrganizationRole.Admin);
    }

    [Fact]
    public async Task SeedAdmin_WithOrganization_HashesPassword()
    {
        // Arrange
        await CreateOrganizationAsync();

        // Act
        await _controller.SeedAdmin(CancellationToken.None);

        // Assert
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
        user.Should().NotBeNull();
        BCrypt.Net.BCrypt.Verify("admin", user!.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task SeedAdmin_WhenNoOrganization_ThrowsNotFoundException()
    {
        // Arrange - no organization created

        // Act
        var act = () => _controller.SeedAdmin(CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*No organization found*");
    }

    [Fact]
    public async Task SeedAdmin_WhenAdminAlreadyExists_ThrowsConflictException()
    {
        // Arrange
        var org = await CreateOrganizationAsync();
        await CreateAdminUserAsync(org.Id);

        // Act
        var act = () => _controller.SeedAdmin(CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*username 'admin' already exists*");
    }

    [Fact]
    public async Task SeedAdmin_WhenAdminAlreadyExists_DoesNotCreateDuplicateUser()
    {
        // Arrange
        var org = await CreateOrganizationAsync();
        await CreateAdminUserAsync(org.Id);

        // Act
        try
        {
            await _controller.SeedAdmin(CancellationToken.None);
        }
        catch (ConflictException)
        {
            // Expected
        }

        // Assert
        var userCount = await _context.Users.CountAsync(u => u.Username == "admin");
        userCount.Should().Be(1);
    }

    [Fact]
    public async Task SeedAdmin_SetsCorrectTimestamps()
    {
        // Arrange
        await CreateOrganizationAsync();

        // Act
        var result = await _controller.SeedAdmin(CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<LoginUserResponse>().Subject;

        response.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        response.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        response.CreatedAt.Should().Be(response.UpdatedAt);
    }

    [Fact]
    public async Task SeedAdmin_ReturnsNullLastLoginAt()
    {
        // Arrange
        await CreateOrganizationAsync();

        // Act
        var result = await _controller.SeedAdmin(CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<LoginUserResponse>().Subject;

        response.LastLoginAt.Should().BeNull();
    }

    #endregion
}
#endif
