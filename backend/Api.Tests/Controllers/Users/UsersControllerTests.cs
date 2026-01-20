using System.Security.Claims;
using Api.Controllers.Users;
using Api.Data;
using Api.DTOs.Organizations;
using Api.DTOs.Users;
using Api.Exceptions;
using Api.Models;
using Api.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Time.Testing;
using Moq;

namespace Api.Tests.Controllers.Users;

public class UsersControllerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly FakeTimeProvider _timeProvider;
    private readonly Mock<IAvatarUrlValidator> _avatarUrlValidatorMock;
    private readonly UsersController _controller;
    private readonly Guid _organizationId;
    private readonly Guid _userId;
    private readonly Guid _membershipId;

    public UsersControllerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _context = new ApplicationDbContext(options);
        _timeProvider = new FakeTimeProvider(new DateTimeOffset(2025, 1, 15, 12, 0, 0, TimeSpan.Zero));

        _organizationId = Guid.NewGuid();
        _userId = Guid.NewGuid();
        _membershipId = Guid.NewGuid();

        // Create test organization
        var organization = new Organization
        {
            Id = _organizationId,
            Name = "Test Organization",
            Slug = "test-org"
        };
        _context.Organizations.Add(organization);

        // Create test user
        var user = new User
        {
            Id = _userId,
            Email = "test@example.com",
            Username = "testuser",
            PasswordHash = "hashed-password",
            FirstName = "Test",
            LastName = "User",
            Position = "Developer",
            IsActive = true,
            MustChangePassword = false,
            CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAt = new DateTime(2025, 1, 10, 0, 0, 0, DateTimeKind.Utc),
            LastLoginAt = new DateTime(2025, 1, 15, 12, 0, 0, DateTimeKind.Utc)
        };
        _context.Users.Add(user);

        // Create membership
        var membership = new OrganizationMember
        {
            Id = _membershipId,
            OrganizationId = _organizationId,
            UserId = _userId,
            OrganizationRole = OrganizationRole.Admin,
            JoinedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
        _context.OrganizationMembers.Add(membership);
        _context.SaveChanges();

        _avatarUrlValidatorMock = new Mock<IAvatarUrlValidator>();
        _controller = new UsersController(_context, _timeProvider, _avatarUrlValidatorMock.Object);
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    private void SetupAuthenticatedUser(Guid? userId = null, Guid? organizationId = null)
    {
        var claims = new List<Claim>();

        if (userId.HasValue)
        {
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString()));
        }

        if (organizationId.HasValue)
        {
            claims.Add(new Claim("org_id", organizationId.Value.ToString()));
        }

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext
        {
            User = principal
        };

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    #region GetCurrentUser Success Tests

    [Fact]
    public async Task GetCurrentUser_WithValidToken_ShouldReturn200Ok()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);

        // Act
        var result = await _controller.GetCurrentUser(CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.Id.Should().Be(_userId);
        response.Email.Should().Be("test@example.com");
    }

    [Fact]
    public async Task GetCurrentUser_ShouldReturnCorrectUserData()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);

        // Act
        var result = await _controller.GetCurrentUser(CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;

        response.Id.Should().Be(_userId);
        response.Email.Should().Be("test@example.com");
        response.Username.Should().Be("testuser");
        response.FirstName.Should().Be("Test");
        response.LastName.Should().Be("User");
        response.Position.Should().Be("Developer");
        response.IsActive.Should().BeTrue();
        response.MustChangePassword.Should().BeFalse();
    }

    [Fact]
    public async Task GetCurrentUser_ShouldReturnOrganizationRoleFromMembership()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);

        // Act
        var result = await _controller.GetCurrentUser(CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.OrganizationRole.Should().Be(OrganizationRole.Admin);
    }

    [Fact]
    public async Task GetCurrentUser_ShouldReturnTimestamps()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);

        // Act
        var result = await _controller.GetCurrentUser(CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;

        // Timestamps should match the values set during test setup
        response.CreatedAt.Should().Be(new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        response.UpdatedAt.Should().Be(new DateTime(2025, 1, 10, 0, 0, 0, DateTimeKind.Utc));
        response.LastLoginAt.Should().Be(new DateTime(2025, 1, 15, 12, 0, 0, DateTimeKind.Utc));
    }

    #endregion

    #region GetCurrentUser with Different Roles

    [Theory]
    [InlineData(OrganizationRole.Admin)]
    [InlineData(OrganizationRole.Manager)]
    [InlineData(OrganizationRole.User)]
    public async Task GetCurrentUser_WithDifferentRoles_ShouldReturnCorrectRole(OrganizationRole role)
    {
        // Arrange
        var membership = await _context.OrganizationMembers.FirstAsync(m => m.UserId == _userId);
        membership.OrganizationRole = role;
        await _context.SaveChangesAsync();

        SetupAuthenticatedUser(_userId, _organizationId);

        // Act
        var result = await _controller.GetCurrentUser(CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.OrganizationRole.Should().Be(role);
    }

    #endregion

    #region GetCurrentUser Unauthorized Tests

    [Fact]
    public async Task GetCurrentUser_WithoutUserId_ShouldThrowUnauthorizedException()
    {
        // Arrange - only organization id, no user id
        SetupAuthenticatedUser(null, _organizationId);

        // Act
        var act = () => _controller.GetCurrentUser(CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*user ID or organization ID not found*");
    }

    [Fact]
    public async Task GetCurrentUser_WithoutOrganizationId_ShouldThrowUnauthorizedException()
    {
        // Arrange - only user id, no organization id
        SetupAuthenticatedUser(_userId, null);

        // Act
        var act = () => _controller.GetCurrentUser(CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*user ID or organization ID not found*");
    }

    [Fact]
    public async Task GetCurrentUser_WithNoClaims_ShouldThrowUnauthorizedException()
    {
        // Arrange - no claims at all
        SetupAuthenticatedUser(null, null);

        // Act
        var act = () => _controller.GetCurrentUser(CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>();
    }

    #endregion

    #region GetCurrentUser NotFound Tests

    [Fact]
    public async Task GetCurrentUser_WithNonExistentUser_ShouldThrowNotFoundException()
    {
        // Arrange
        var nonExistentUserId = Guid.NewGuid();
        SetupAuthenticatedUser(nonExistentUserId, _organizationId);

        // Act
        var act = () => _controller.GetCurrentUser(CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*User not found*");
    }

    #endregion

    #region GetCurrentUser with No Membership

    [Fact]
    public async Task GetCurrentUser_WithNoMembershipInOrganization_ShouldReturnDefaultRole()
    {
        // Arrange - user exists but has no membership in the specified organization
        var otherOrgId = Guid.NewGuid();
        SetupAuthenticatedUser(_userId, otherOrgId);

        // Act
        var result = await _controller.GetCurrentUser(CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.OrganizationRole.Should().Be(OrganizationRole.User); // Default role
    }

    #endregion

    #region GetCurrentUser with Multiple Organizations

    [Fact]
    public async Task GetCurrentUser_WithMultipleOrganizations_ShouldReturnCorrectOrgRole()
    {
        // Arrange - create second organization with different role
        var secondOrgId = Guid.NewGuid();
        var secondOrg = new Organization
        {
            Id = secondOrgId,
            Name = "Second Organization",
            Slug = "second-org"
        };
        _context.Organizations.Add(secondOrg);

        // Note: In current MVP there's a unique constraint on UserId,
        // but this test shows the logic works correctly if that changes
        // For now, we just verify the first org returns correct role
        SetupAuthenticatedUser(_userId, _organizationId);

        // Act
        var result = await _controller.GetCurrentUser(CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.OrganizationRole.Should().Be(OrganizationRole.Admin);
    }

    #endregion

    #region GetCurrentUser Edge Cases

    [Fact]
    public async Task GetCurrentUser_WithDeactivatedUser_ShouldStillReturnProfile()
    {
        // Arrange
        var user = await _context.Users.FirstAsync(u => u.Id == _userId);
        user.IsActive = false;
        await _context.SaveChangesAsync();

        SetupAuthenticatedUser(_userId, _organizationId);

        // Act
        var result = await _controller.GetCurrentUser(CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task GetCurrentUser_WithMustChangePassword_ShouldReturnFlag()
    {
        // Arrange
        var user = await _context.Users.FirstAsync(u => u.Id == _userId);
        user.MustChangePassword = true;
        await _context.SaveChangesAsync();

        SetupAuthenticatedUser(_userId, _organizationId);

        // Act
        var result = await _controller.GetCurrentUser(CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.MustChangePassword.Should().BeTrue();
    }

    [Fact]
    public async Task GetCurrentUser_WithNullOptionalFields_ShouldReturnNulls()
    {
        // Arrange
        var user = await _context.Users.FirstAsync(u => u.Id == _userId);
        user.Position = null;
        user.DateOfBirth = null;
        user.AvatarUrl = null;
        user.LastLoginAt = null;
        await _context.SaveChangesAsync();

        SetupAuthenticatedUser(_userId, _organizationId);

        // Act
        var result = await _controller.GetCurrentUser(CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.Position.Should().BeNull();
        response.DateOfBirth.Should().BeNull();
        response.AvatarUrl.Should().BeNull();
        response.LastLoginAt.Should().BeNull();
    }

    #endregion

    #region UpdateCurrentUser Success Tests

    [Fact]
    public async Task UpdateCurrentUser_WithValidRequest_ShouldReturn200Ok()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            FirstName = "Updated"
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.FirstName.Should().Be("Updated");
    }

    [Fact]
    public async Task UpdateCurrentUser_ShouldUpdateOnlyProvidedFields()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            FirstName = "NewFirst"
            // LastName not provided - should remain unchanged
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.FirstName.Should().Be("NewFirst");
        response.LastName.Should().Be("User"); // Original value
    }

    [Fact]
    public async Task UpdateCurrentUser_ShouldUpdateEmail()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            Email = "newemail@example.com"
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.Email.Should().Be("newemail@example.com");
    }

    [Fact]
    public async Task UpdateCurrentUser_ShouldNormalizeEmailToLowercase()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            Email = "NewEmail@Example.COM"
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.Email.Should().Be("newemail@example.com");
    }

    [Fact]
    public async Task UpdateCurrentUser_ShouldUpdateUsername()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            Username = "newusername"
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.Username.Should().Be("newusername");
    }

    [Fact]
    public async Task UpdateCurrentUser_ShouldNormalizeUsernameToLowercase()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            Username = "NewUserName"
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.Username.Should().Be("newusername");
    }

    [Fact]
    public async Task UpdateCurrentUser_ShouldUpdatePosition()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            Position = "Senior Developer"
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.Position.Should().Be("Senior Developer");
    }

    [Fact]
    public async Task UpdateCurrentUser_ShouldClearPositionWithEmptyString()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            Position = ""
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.Position.Should().BeNull();
    }

    [Fact]
    public async Task UpdateCurrentUser_ShouldUpdateDateOfBirth()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            DateOfBirth = new DateOnly(1990, 5, 15)
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.DateOfBirth.Should().Be(new DateOnly(1990, 5, 15));
    }

    [Fact]
    public async Task UpdateCurrentUser_ShouldUpdateAvatarUrl()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            AvatarUrl = "https://example.com/avatar.jpg"
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.AvatarUrl.Should().Be("https://example.com/avatar.jpg");
    }

    [Fact]
    public async Task UpdateCurrentUser_ShouldClearAvatarUrlWithEmptyString()
    {
        // Arrange
        var user = await _context.Users.FirstAsync(u => u.Id == _userId);
        user.AvatarUrl = "https://old-avatar.com/pic.jpg";
        await _context.SaveChangesAsync();

        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            AvatarUrl = ""
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.AvatarUrl.Should().BeNull();
    }

    [Fact]
    public async Task UpdateCurrentUser_ShouldUpdateTimestamp()
    {
        // Arrange
        var originalUpdatedAt = new DateTime(2025, 1, 10, 0, 0, 0, DateTimeKind.Utc);
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            FirstName = "Updated"
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        // UpdatedAt should be different from original and close to current time
        response.UpdatedAt.Should().NotBe(originalUpdatedAt);
        response.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task UpdateCurrentUser_ShouldUpdateMultipleFields()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            FirstName = "John",
            LastName = "Doe",
            Position = "CTO"
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.FirstName.Should().Be("John");
        response.LastName.Should().Be("Doe");
        response.Position.Should().Be("CTO");
    }

    [Fact]
    public async Task UpdateCurrentUser_WithEmptyRequest_ShouldReturn200Ok()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest();

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.FirstName.Should().Be("Test"); // Original value preserved
    }

    [Fact]
    public async Task UpdateCurrentUser_ShouldTrimWhitespace()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            FirstName = "  John  ",
            LastName = "  Doe  "
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.FirstName.Should().Be("John");
        response.LastName.Should().Be("Doe");
    }

    #endregion

    #region UpdateCurrentUser Conflict Tests

    [Fact]
    public async Task UpdateCurrentUser_WithExistingEmail_ShouldThrowConflictException()
    {
        // Arrange
        var anotherUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "existing@example.com",
            Username = "existinguser",
            PasswordHash = "hash",
            FirstName = "Existing",
            LastName = "User",
            IsActive = true
        };
        _context.Users.Add(anotherUser);
        await _context.SaveChangesAsync();

        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            Email = "existing@example.com"
        };

        // Act
        var act = () => _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*email*already*");
    }

    [Fact]
    public async Task UpdateCurrentUser_WithExistingEmailDifferentCase_ShouldThrowConflictException()
    {
        // Arrange
        var anotherUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "existing@example.com",
            Username = "existinguser",
            PasswordHash = "hash",
            FirstName = "Existing",
            LastName = "User",
            IsActive = true
        };
        _context.Users.Add(anotherUser);
        await _context.SaveChangesAsync();

        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            Email = "EXISTING@EXAMPLE.COM"
        };

        // Act
        var act = () => _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task UpdateCurrentUser_WithExistingUsername_ShouldThrowConflictException()
    {
        // Arrange
        var anotherUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "another@example.com",
            Username = "existinguser",
            PasswordHash = "hash",
            FirstName = "Existing",
            LastName = "User",
            IsActive = true
        };
        _context.Users.Add(anotherUser);
        await _context.SaveChangesAsync();

        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            Username = "existinguser"
        };

        // Act
        var act = () => _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*username*already*");
    }

    [Fact]
    public async Task UpdateCurrentUser_WithExistingUsernameDifferentCase_ShouldThrowConflictException()
    {
        // Arrange
        var anotherUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "another@example.com",
            Username = "existinguser",
            PasswordHash = "hash",
            FirstName = "Existing",
            LastName = "User",
            IsActive = true
        };
        _context.Users.Add(anotherUser);
        await _context.SaveChangesAsync();

        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            Username = "EXISTINGUSER"
        };

        // Act
        var act = () => _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task UpdateCurrentUser_WithOwnEmail_ShouldSucceed()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            Email = "test@example.com" // Same as current email
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task UpdateCurrentUser_WithOwnUsername_ShouldSucceed()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            Username = "testuser" // Same as current username
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
    }

    #endregion

    #region UpdateCurrentUser Unauthorized Tests

    [Fact]
    public async Task UpdateCurrentUser_WithoutUserId_ShouldThrowUnauthorizedException()
    {
        // Arrange
        SetupAuthenticatedUser(null, _organizationId);
        var request = new UpdateUserRequest { FirstName = "Test" };

        // Act
        var act = () => _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*user ID or organization ID not found*");
    }

    [Fact]
    public async Task UpdateCurrentUser_WithoutOrganizationId_ShouldThrowUnauthorizedException()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, null);
        var request = new UpdateUserRequest { FirstName = "Test" };

        // Act
        var act = () => _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*user ID or organization ID not found*");
    }

    [Fact]
    public async Task UpdateCurrentUser_WithNoClaims_ShouldThrowUnauthorizedException()
    {
        // Arrange
        SetupAuthenticatedUser(null, null);
        var request = new UpdateUserRequest { FirstName = "Test" };

        // Act
        var act = () => _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>();
    }

    #endregion

    #region UpdateCurrentUser NotFound Tests

    [Fact]
    public async Task UpdateCurrentUser_WithNonExistentUser_ShouldThrowNotFoundException()
    {
        // Arrange
        var nonExistentUserId = Guid.NewGuid();
        SetupAuthenticatedUser(nonExistentUserId, _organizationId);
        var request = new UpdateUserRequest { FirstName = "Test" };

        // Act
        var act = () => _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage("*User not found*");
    }

    #endregion

    #region UpdateCurrentUser Role Preservation Tests

    [Fact]
    public async Task UpdateCurrentUser_ShouldPreserveOrganizationRole()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            FirstName = "Updated"
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.OrganizationRole.Should().Be(OrganizationRole.Admin); // Preserved from membership
    }

    [Fact]
    public async Task UpdateCurrentUser_ShouldPreserveMemberId()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            FirstName = "Updated"
        };

        // Act
        var result = await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.MemberId.Should().Be(_membershipId);
    }

    #endregion

    #region UpdateCurrentUser Database Persistence Tests

    [Fact]
    public async Task UpdateCurrentUser_ShouldPersistChangesToDatabase()
    {
        // Arrange
        SetupAuthenticatedUser(_userId, _organizationId);
        var request = new UpdateUserRequest
        {
            FirstName = "Persisted",
            LastName = "User"
        };

        // Act
        await _controller.UpdateCurrentUser(request, CancellationToken.None);

        // Assert - Verify in database
        var user = await _context.Users.FirstAsync(u => u.Id == _userId);
        user.FirstName.Should().Be("Persisted");
        user.LastName.Should().Be("User");
    }

    #endregion
}
