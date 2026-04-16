using System.Security.Claims;
using Api.Common.Constants;
using Api.Configuration;
using Api.Controllers.Organizations;
using Api.Data;
using Api.DTOs.Common;
using Api.DTOs.Organizations;
using Api.Exceptions;
using Api.Models;
using Api.Services;
using AwesomeAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using Moq;

namespace Api.Tests.Controllers.Organizations;

public class OrganizationMembersControllerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<IPasswordService> _passwordServiceMock;
    private readonly FakeTimeProvider _timeProvider;
    private readonly OrganizationMembersController _controller;
    private readonly Guid _organizationId;

    public OrganizationMembersControllerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _context = new ApplicationDbContext(options);
        _passwordServiceMock = new Mock<IPasswordService>();
        _timeProvider = new FakeTimeProvider(new DateTimeOffset(2025, 1, 15, 12, 0, 0, TimeSpan.Zero));

        _passwordServiceMock.Setup(p => p.GenerateTemporaryPassword(It.IsAny<int>()))
            .Returns("TempPassword123!");
        _passwordServiceMock.Setup(p => p.HashPassword(It.IsAny<string>()))
            .Returns("$2a$12$hashedpassword");

        // Create test organization
        _organizationId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = _organizationId,
            Name = "Test Organization",
            Slug = "test-org"
        };
        _context.Organizations.Add(organization);
        _context.SaveChanges();

        var securitySettings = Options.Create(new SecuritySettings());
        _controller = new OrganizationMembersController(_context, _passwordServiceMock.Object, _timeProvider, securitySettings);

        // Set up HttpContext with User claims for authorization
        var claims = new List<Claim>
        {
            new Claim("org_id", _organizationId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    private async Task<User> CreateExistingUserAsync(string email, string username)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Username = username,
            PasswordHash = "hash",
            FirstName = "Existing",
            LastName = "User"
        };
        var membership = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = _organizationId,
            UserId = user.Id,
            OrganizationRole = OrganizationRole.User,
            JoinedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        _context.OrganizationMembers.Add(membership);
        await _context.SaveChangesAsync();
        return user;
    }

    [Fact]
    public async Task AddMember_WithValidRequest_ShouldReturn201Created()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "john.doe@test.com",
            FirstName = "John",
            LastName = "Doe"
        };

        // Act
        var result = await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(201);

        var response = objectResult.Value.Should().BeOfType<CreateUserResponse>().Subject;
        response.User.Email.Should().Be("john.doe@test.com");
        response.User.Username.Should().Be("john.doe");
        response.User.FirstName.Should().Be("John");
        response.User.LastName.Should().Be("Doe");
        response.User.DisplayName.Should().Be("John Doe");
        response.TemporaryPassword.Should().Be("TempPassword123!");
        response.Message.Should().Contain("User created successfully");
    }

    [Fact]
    public async Task AddMember_WithNonExistentOrganization_ShouldThrowNotFoundException()
    {
        // Arrange
        var nonExistentOrgId = Guid.NewGuid();
        var request = new CreateUserRequest
        {
            Email = "test@test.com",
            FirstName = "Test",
            LastName = "User"
        };

        // Act
        var act = () => _controller.AddMember(nonExistentOrgId, request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"*Organization*{nonExistentOrgId}*not found*");
    }

    [Fact]
    public async Task AddMember_ShouldAutoGenerateUsernameFromEmail()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "jane.smith@company.com",
            FirstName = "Jane",
            LastName = "Smith"
        };

        // Act
        var result = await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<CreateUserResponse>().Subject;
        response.User.Username.Should().Be("jane.smith");
    }

    [Fact]
    public async Task AddMember_WithProvidedUsername_ShouldUseIt()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "john@test.com",
            Username = "custom_user",
            FirstName = "John",
            LastName = "Doe"
        };

        // Act
        var result = await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<CreateUserResponse>().Subject;
        response.User.Username.Should().Be("custom_user");
    }

    [Fact]
    public async Task AddMember_WithExistingEmail_ShouldThrowConflictException()
    {
        // Arrange
        await CreateExistingUserAsync("existing@test.com", "existing");

        var request = new CreateUserRequest
        {
            Email = "existing@test.com",
            FirstName = "New",
            LastName = "User"
        };

        // Act
        var act = () => _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*email*existing@test.com*already exists*");
    }

    [Fact]
    public async Task AddMember_WithExistingUsername_ShouldThrowConflictException()
    {
        // Arrange
        await CreateExistingUserAsync("user1@test.com", "taken_username");

        var request = new CreateUserRequest
        {
            Email = "newuser@test.com",
            Username = "taken_username",
            FirstName = "New",
            LastName = "User"
        };

        // Act
        var act = () => _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*username*taken_username*already exists*");
    }

    [Fact]
    public async Task AddMember_WithExistingEmailDifferentCase_ShouldThrowConflictException()
    {
        // Arrange
        await CreateExistingUserAsync("existing@test.com", "existing");

        var request = new CreateUserRequest
        {
            Email = "EXISTING@TEST.COM",
            FirstName = "New",
            LastName = "User"
        };

        // Act
        var act = () => _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*email*existing@test.com*already exists*");
    }

    [Fact]
    public async Task AddMember_WithExistingUsernameDifferentCase_ShouldThrowConflictException()
    {
        // Arrange
        await CreateExistingUserAsync("user1@test.com", "taken_username");

        var request = new CreateUserRequest
        {
            Email = "newuser@test.com",
            Username = "TAKEN_USERNAME",
            FirstName = "New",
            LastName = "User"
        };

        // Act
        var act = () => _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*username*taken_username*already exists*");
    }

    [Fact]
    public async Task AddMember_ShouldSetMustChangePasswordToTrue()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "newuser@test.com",
            FirstName = "New",
            LastName = "User"
        };

        // Act
        await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var user = await _context.Users.FirstAsync(u => u.Email == "newuser@test.com");
        user.MustChangePassword.Should().BeTrue();
    }

    [Fact]
    public async Task AddMember_ShouldHashPassword()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "newuser@test.com",
            FirstName = "New",
            LastName = "User"
        };

        // Act
        await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        _passwordServiceMock.Verify(p => p.GenerateTemporaryPassword(16), Times.Once);
        _passwordServiceMock.Verify(p => p.HashPassword("TempPassword123!"), Times.Once);
    }

    [Fact]
    public async Task AddMember_WithRole_ShouldSetRole()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "manager@test.com",
            FirstName = "Manager",
            LastName = "User",
            OrganizationRole = OrganizationRole.Manager
        };

        // Act
        var result = await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<CreateUserResponse>().Subject;
        response.User.OrganizationRole.Should().Be(OrganizationRole.Manager);
    }

    [Fact]
    public async Task AddMember_ShouldNormalizeEmailToLowercase()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "John.Doe@TEST.com",
            FirstName = "John",
            LastName = "Doe"
        };

        // Act
        var result = await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<CreateUserResponse>().Subject;
        response.User.Email.Should().Be("john.doe@test.com");
    }

    [Fact]
    public async Task AddMember_ShouldPersistMemberToDatabase()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "persist@test.com",
            FirstName = "Persist",
            LastName = "Test",
            Position = "Developer",
            DateOfBirth = new DateOnly(1990, 5, 15)
        };

        // Act
        await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var user = await _context.Users.FirstAsync(u => u.Email == "persist@test.com");
        user.Should().NotBeNull();
        user.FirstName.Should().Be("Persist");
        user.LastName.Should().Be("Test");
        user.Position.Should().Be("Developer");
        user.DateOfBirth.Should().Be(new DateOnly(1990, 5, 15));
        user.IsActive.Should().BeTrue();

        // Verify organization membership was created
        var membership = await _context.OrganizationMembers.FirstAsync(m => m.UserId == user.Id);
        membership.Should().NotBeNull();
        membership.OrganizationId.Should().Be(_organizationId);
    }

    [Fact]
    public async Task AddMember_ShouldReturnMemberWithAllFields()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "complete@test.com",
            Username = "complete_user",
            FirstName = "Complete",
            LastName = "User",
            OrganizationRole = OrganizationRole.Admin,
            Position = "CTO",
            DateOfBirth = new DateOnly(1985, 12, 25)
        };

        // Act
        var result = await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<CreateUserResponse>().Subject;

        response.User.Id.Should().NotBeEmpty();
        response.User.MemberId.Should().NotBeEmpty();
        response.User.Email.Should().Be("complete@test.com");
        response.User.Username.Should().Be("complete_user");
        response.User.FirstName.Should().Be("Complete");
        response.User.LastName.Should().Be("User");
        response.User.DisplayName.Should().Be("Complete User");
        response.User.OrganizationRole.Should().Be(OrganizationRole.Admin);
        response.User.Position.Should().Be("CTO");
        response.User.DateOfBirth.Should().Be(new DateOnly(1985, 12, 25));
        response.User.IsActive.Should().BeTrue();
        response.User.MustChangePassword.Should().BeTrue();
    }

    [Fact]
    public async Task AddMember_WithoutRole_ShouldDefaultToUser()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "default.role@test.com",
            FirstName = "Default",
            LastName = "Role"
        };

        // Act
        var result = await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<CreateUserResponse>().Subject;
        response.User.OrganizationRole.Should().Be(OrganizationRole.User);
    }

    [Fact]
    public async Task AddMember_ShouldNormalizeProvidedUsernameToLowercase()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "test@test.com",
            Username = "MyUserName",
            FirstName = "Test",
            LastName = "User"
        };

        // Act
        var result = await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<CreateUserResponse>().Subject;
        response.User.Username.Should().Be("myusername");
    }

    [Fact]
    public async Task AddMember_ShouldTrimWhitespaceFromFields()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "  trimtest@test.com  ",
            FirstName = "  Trim  ",
            LastName = "  Test  ",
            Position = "  Developer  "
        };

        // Act
        await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var user = await _context.Users.FirstAsync(u => u.Email == "trimtest@test.com");
        user.FirstName.Should().Be("Trim");
        user.LastName.Should().Be("Test");
        user.Position.Should().Be("Developer");
    }

    [Fact]
    public async Task AddMember_ShouldReturn201StatusCode()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "route@test.com",
            FirstName = "Route",
            LastName = "Test"
        };

        // Act
        var result = await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(201);

        var response = objectResult.Value.Should().BeOfType<CreateUserResponse>().Subject;
        response.User.Email.Should().Be("route@test.com");
    }

    [Fact]
    public async Task AddMember_WithAdminRole_ShouldCreateAdminMembership()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "admin@test.com",
            FirstName = "Admin",
            LastName = "User",
            OrganizationRole = OrganizationRole.Admin
        };

        // Act
        await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var user = await _context.Users.FirstAsync(u => u.Email == "admin@test.com");
        var membership = await _context.OrganizationMembers.FirstAsync(m => m.UserId == user.Id);
        membership.OrganizationRole.Should().Be(OrganizationRole.Admin);
        membership.OrganizationId.Should().Be(_organizationId);
    }

    #region Username Generation Edge Cases

    [Fact]
    public async Task AddMember_WithSpecialCharsInEmail_ShouldStripInvalidChars()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "john+test!#$%@example.com",
            FirstName = "John",
            LastName = "Test"
        };

        // Act
        var result = await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<CreateUserResponse>().Subject;
        response.User.Username.Should().Be("johntest");
    }

    [Fact]
    public async Task AddMember_WithWhitespaceOnlyUsername_ShouldGenerateFromEmail()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "fallback@example.com",
            Username = "   ",
            FirstName = "Test",
            LastName = "User"
        };

        // Act
        var result = await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<CreateUserResponse>().Subject;
        response.User.Username.Should().Be("fallback");
    }

    [Fact]
    public async Task AddMember_WithDotsAndUnderscoresInEmail_ShouldPreserveThem()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "john.doe_test@example.com",
            FirstName = "John",
            LastName = "Doe"
        };

        // Act
        var result = await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<CreateUserResponse>().Subject;
        response.User.Username.Should().Be("john.doe_test");
    }

    [Fact]
    public async Task AddMember_WithHyphensInEmail_ShouldPreserveThem()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "john-doe@example.com",
            FirstName = "John",
            LastName = "Doe"
        };

        // Act
        var result = await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<CreateUserResponse>().Subject;
        response.User.Username.Should().Be("john-doe");
    }

    #endregion

    #region Timestamp Tests

    [Fact]
    public async Task AddMember_ShouldSetPasswordChangedAtToCurrentTime()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "timestamp@test.com",
            FirstName = "Timestamp",
            LastName = "Test"
        };

        // Act
        await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var user = await _context.Users.FirstAsync(u => u.Email == "timestamp@test.com");
        user.PasswordChangedAt.Should().Be(new DateTime(2025, 1, 15, 12, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public async Task AddMember_ShouldSetMembershipJoinedAtToCurrentTime()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "jointime@test.com",
            FirstName = "Join",
            LastName = "Time"
        };

        // Act
        await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var user = await _context.Users.FirstAsync(u => u.Email == "jointime@test.com");
        var membership = await _context.OrganizationMembers.FirstAsync(m => m.UserId == user.Id);
        membership.JoinedAt.Should().Be(new DateTime(2025, 1, 15, 12, 0, 0, DateTimeKind.Utc));
    }

    #endregion

    #region Optional Fields Tests

    [Fact]
    public async Task AddMember_WithoutOptionalFields_ShouldSetThemToNull()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "minimal@test.com",
            FirstName = "Minimal",
            LastName = "User"
        };

        // Act
        var result = await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<CreateUserResponse>().Subject;
        response.User.Position.Should().BeNull();
        response.User.DateOfBirth.Should().BeNull();
        response.User.AvatarUrl.Should().BeNull();
    }

    [Fact]
    public async Task AddMember_WithNullPosition_ShouldNotTrim()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "nullposition@test.com",
            FirstName = "Test",
            LastName = "User",
            Position = null
        };

        // Act
        await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var user = await _context.Users.FirstAsync(u => u.Email == "nullposition@test.com");
        user.Position.Should().BeNull();
    }

    #endregion

    #region User IsActive Tests

    [Fact]
    public async Task AddMember_ShouldSetUserIsActiveToTrue()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "active@test.com",
            FirstName = "Active",
            LastName = "User"
        };

        // Act
        var result = await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<CreateUserResponse>().Subject;
        response.User.IsActive.Should().BeTrue();

        var user = await _context.Users.FirstAsync(u => u.Email == "active@test.com");
        user.IsActive.Should().BeTrue();
    }

    #endregion

    #region Response MustChangePassword Tests

    [Fact]
    public async Task AddMember_ResponseShouldIncludeMustChangePasswordTrue()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "mustchange@test.com",
            FirstName = "Must",
            LastName = "Change"
        };

        // Act
        var result = await _controller.AddMember(_organizationId, request, CancellationToken.None);

        // Assert
        var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
        var response = objectResult.Value.Should().BeOfType<CreateUserResponse>().Subject;
        response.User.MustChangePassword.Should().BeTrue();
    }

    #endregion

    #region GetMembers Tests

    private async Task<List<(User User, OrganizationMember Member)>> CreateTestMembersAsync(int count)
    {
        var result = new List<(User, OrganizationMember)>();
        for (int i = 0; i < count; i++)
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = $"user{i}@test.com",
                Username = $"user{i}",
                PasswordHash = "hash",
                FirstName = $"First{i}",
                LastName = $"Last{i}",
                IsActive = true,
                Position = i % 2 == 0 ? "Developer" : "Designer"
            };
            var membership = new OrganizationMember
            {
                Id = Guid.NewGuid(),
                OrganizationId = _organizationId,
                UserId = user.Id,
                OrganizationRole = i == 0 ? OrganizationRole.Admin : (i % 3 == 0 ? OrganizationRole.Manager : OrganizationRole.User),
                JoinedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            _context.OrganizationMembers.Add(membership);
            result.Add((user, membership));
        }
        await _context.SaveChangesAsync();
        return result;
    }

    [Fact]
    public async Task GetMembers_WithValidOrganization_ShouldReturn200Ok()
    {
        // Arrange
        await CreateTestMembersAsync(3);
        var query = new GetMembersQueryParameters();

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetMembers_WithNonExistentOrganization_ShouldThrowNotFoundException()
    {
        // Arrange
        var nonExistentOrgId = Guid.NewGuid();
        var query = new GetMembersQueryParameters();

        // Act
        var act = () => _controller.GetMembers(nonExistentOrgId, query, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"*Organization*{nonExistentOrgId}*not found*");
    }

    [Fact]
    public async Task GetMembers_WithEmptyOrganization_ShouldReturnEmptyList()
    {
        // Arrange
        var query = new GetMembersQueryParameters();

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().BeEmpty();
        response.TotalItems.Should().Be(0);
        response.TotalPages.Should().Be(0);
    }

    [Fact]
    public async Task GetMembers_ShouldReturnCorrectPaginationMetadata()
    {
        // Arrange
        await CreateTestMembersAsync(25);
        var query = new GetMembersQueryParameters { Page = 2, PageSize = 10 };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Page.Should().Be(2);
        response.PageSize.Should().Be(10);
        response.TotalItems.Should().Be(25);
        response.TotalPages.Should().Be(3);
        response.HasPreviousPage.Should().BeTrue();
        response.HasNextPage.Should().BeTrue();
        response.Items.Should().HaveCount(10);
    }

    [Fact]
    public async Task GetMembers_OnFirstPage_ShouldHaveNoPreviousPage()
    {
        // Arrange
        await CreateTestMembersAsync(15);
        var query = new GetMembersQueryParameters { Page = 1, PageSize = 10 };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.HasPreviousPage.Should().BeFalse();
        response.HasNextPage.Should().BeTrue();
    }

    [Fact]
    public async Task GetMembers_OnLastPage_ShouldHaveNoNextPage()
    {
        // Arrange
        await CreateTestMembersAsync(15);
        var query = new GetMembersQueryParameters { Page = 2, PageSize = 10 };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.HasPreviousPage.Should().BeTrue();
        response.HasNextPage.Should().BeFalse();
        response.Items.Should().HaveCount(5);
    }

    [Fact]
    public async Task GetMembers_WithSearchByEmail_ShouldFilterResults()
    {
        // Arrange
        await CreateTestMembersAsync(5);
        var query = new GetMembersQueryParameters { Search = "user2@test" };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().HaveCount(1);
        response.Items[0].Email.Should().Be("user2@test.com");
    }

    [Fact]
    public async Task GetMembers_WithSearchByFirstName_ShouldFilterResults()
    {
        // Arrange
        await CreateTestMembersAsync(5);
        var query = new GetMembersQueryParameters { Search = "First3" };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().HaveCount(1);
        response.Items[0].FirstName.Should().Be("First3");
    }

    [Fact]
    public async Task GetMembers_WithSearchByLastName_ShouldFilterResults()
    {
        // Arrange
        await CreateTestMembersAsync(5);
        var query = new GetMembersQueryParameters { Search = "Last4" };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().HaveCount(1);
        response.Items[0].LastName.Should().Be("Last4");
    }

    [Fact]
    public async Task GetMembers_WithSearchByUsername_ShouldFilterResults()
    {
        // Arrange
        await CreateTestMembersAsync(5);
        var query = new GetMembersQueryParameters { Search = "user1" };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().HaveCount(1);
        response.Items[0].Username.Should().Be("user1");
    }

    [Fact]
    public async Task GetMembers_SearchShouldBeCaseInsensitive()
    {
        // Arrange
        await CreateTestMembersAsync(5);
        var query = new GetMembersQueryParameters { Search = "USER2" };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().HaveCount(1);
        response.Items[0].Email.Should().Be("user2@test.com");
    }

    [Fact]
    public async Task GetMembers_WithRoleFilter_ShouldFilterByRole()
    {
        // Arrange
        await CreateTestMembersAsync(10);
        var query = new GetMembersQueryParameters { OrganizationRole = OrganizationRole.Admin };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().AllSatisfy(m => m.OrganizationRole.Should().Be(OrganizationRole.Admin));
    }

    [Fact]
    public async Task GetMembers_WithIsActiveFilter_ShouldFilterByActiveStatus()
    {
        // Arrange
        var members = await CreateTestMembersAsync(5);
        // Deactivate some users
        members[1].User.IsActive = false;
        members[3].User.IsActive = false;
        await _context.SaveChangesAsync();

        var query = new GetMembersQueryParameters { IsActive = true };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().HaveCount(3);
        response.Items.Should().AllSatisfy(m => m.IsActive.Should().BeTrue());
    }

    [Fact]
    public async Task GetMembers_WithIsActiveFalseFilter_ShouldReturnInactiveUsers()
    {
        // Arrange
        var members = await CreateTestMembersAsync(5);
        members[1].User.IsActive = false;
        members[3].User.IsActive = false;
        await _context.SaveChangesAsync();

        var query = new GetMembersQueryParameters { IsActive = false };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().HaveCount(2);
        response.Items.Should().AllSatisfy(m => m.IsActive.Should().BeFalse());
    }

    [Fact]
    public async Task GetMembers_WithSortByEmailAsc_ShouldSortCorrectly()
    {
        // Arrange
        await CreateTestMembersAsync(5);
        var query = new GetMembersQueryParameters { SortBy = "email", SortOrder = "asc" };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().BeInAscendingOrder(m => m.Email);
    }

    [Fact]
    public async Task GetMembers_WithSortByEmailDesc_ShouldSortCorrectly()
    {
        // Arrange
        await CreateTestMembersAsync(5);
        var query = new GetMembersQueryParameters { SortBy = "email", SortOrder = "desc" };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().BeInDescendingOrder(m => m.Email);
    }

    [Fact]
    public async Task GetMembers_WithSortByFirstNameAsc_ShouldSortCorrectly()
    {
        // Arrange
        await CreateTestMembersAsync(5);
        var query = new GetMembersQueryParameters { SortBy = "firstName", SortOrder = "asc" };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().BeInAscendingOrder(m => m.FirstName);
    }

    [Fact]
    public async Task GetMembers_WithSortByLastNameDesc_ShouldSortCorrectly()
    {
        // Arrange
        await CreateTestMembersAsync(5);
        var query = new GetMembersQueryParameters { SortBy = "lastName", SortOrder = "desc" };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().BeInDescendingOrder(m => m.LastName);
    }

    [Fact]
    public async Task GetMembers_WithDefaultSort_ShouldSortByCreatedAtDesc()
    {
        // Arrange
        await CreateTestMembersAsync(5);
        var query = new GetMembersQueryParameters();

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().BeInDescendingOrder(m => m.CreatedAt);
    }

    [Fact]
    public async Task GetMembers_WithMultipleFilters_ShouldApplyAllFilters()
    {
        // Arrange
        await CreateTestMembersAsync(10);
        var query = new GetMembersQueryParameters
        {
            Search = "user",
            OrganizationRole = OrganizationRole.User,
            IsActive = true
        };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().AllSatisfy(m =>
        {
            m.OrganizationRole.Should().Be(OrganizationRole.User);
            m.IsActive.Should().BeTrue();
        });
    }

    [Fact]
    public async Task GetMembers_ShouldReturnCorrectMemberFields()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "complete@test.com",
            Username = "completeuser",
            PasswordHash = "hash",
            FirstName = "Complete",
            LastName = "User",
            Position = "Senior Developer",
            DateOfBirth = new DateOnly(1990, 5, 15),
            AvatarUrl = "https://example.com/avatar.jpg",
            IsActive = true,
            MustChangePassword = false
        };
        var membership = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = _organizationId,
            UserId = user.Id,
            OrganizationRole = OrganizationRole.Manager,
            JoinedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        _context.OrganizationMembers.Add(membership);
        await _context.SaveChangesAsync();

        var query = new GetMembersQueryParameters();

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        var member = response.Items.First();

        member.Id.Should().Be(user.Id);
        member.Email.Should().Be("complete@test.com");
        member.Username.Should().Be("completeuser");
        member.FirstName.Should().Be("Complete");
        member.LastName.Should().Be("User");
        member.DisplayName.Should().Be("Complete User");
        member.OrganizationRole.Should().Be(OrganizationRole.Manager);
        member.Position.Should().Be("Senior Developer");
        member.DateOfBirth.Should().Be(new DateOnly(1990, 5, 15));
        member.AvatarUrl.Should().Be("https://example.com/avatar.jpg");
        member.IsActive.Should().BeTrue();
        member.MustChangePassword.Should().BeFalse();
    }

    [Fact]
    public async Task GetMembers_ShouldOnlyReturnMembersFromSpecifiedOrganization()
    {
        // Arrange
        await CreateTestMembersAsync(3);

        // Create another organization with members
        var otherOrgId = Guid.NewGuid();
        var otherOrg = new Organization
        {
            Id = otherOrgId,
            Name = "Other Organization",
            Slug = "other-org"
        };
        _context.Organizations.Add(otherOrg);

        var otherUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "other@other.com",
            Username = "otheruser",
            PasswordHash = "hash",
            FirstName = "Other",
            LastName = "User"
        };
        var otherMembership = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = otherOrgId,
            UserId = otherUser.Id,
            OrganizationRole = OrganizationRole.User,
            JoinedAt = DateTime.UtcNow
        };
        _context.Users.Add(otherUser);
        _context.OrganizationMembers.Add(otherMembership);
        await _context.SaveChangesAsync();

        var query = new GetMembersQueryParameters();

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().HaveCount(3);
        response.Items.Should().NotContain(m => m.Email == "other@other.com");
    }

    [Fact]
    public async Task GetMembers_WithPageSizeGreaterThanTotalItems_ShouldReturnAllItems()
    {
        // Arrange
        await CreateTestMembersAsync(5);
        var query = new GetMembersQueryParameters { PageSize = 100 };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().HaveCount(5);
        response.TotalPages.Should().Be(1);
        response.HasNextPage.Should().BeFalse();
    }

    [Fact]
    public async Task GetMembers_WithSearchNoMatch_ShouldReturnEmptyList()
    {
        // Arrange
        await CreateTestMembersAsync(5);
        var query = new GetMembersQueryParameters { Search = "nonexistent" };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().BeEmpty();
        response.TotalItems.Should().Be(0);
    }

    [Fact]
    public async Task GetMembers_SearchShouldMatchPartialStrings()
    {
        // Arrange
        await CreateTestMembersAsync(5);
        var query = new GetMembersQueryParameters { Search = "test.com" };

        // Act
        var result = await _controller.GetMembers(_organizationId, query, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<UserInfo>>().Subject;
        response.Items.Should().HaveCount(5); // All users have @test.com
    }

    #endregion

    #region RemoveMember Tests

    private async Task<(User User, OrganizationMember Membership)> CreateMemberAsync(
        OrganizationRole role = OrganizationRole.User,
        string? emailPrefix = null)
    {
        var prefix = emailPrefix ?? Guid.NewGuid().ToString("N")[..8];
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = $"{prefix}@test.com",
            Username = prefix,
            PasswordHash = "hash",
            FirstName = "Test",
            LastName = "User",
            IsActive = true
        };
        var membership = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = _organizationId,
            UserId = user.Id,
            OrganizationRole = role,
            JoinedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        _context.OrganizationMembers.Add(membership);
        await _context.SaveChangesAsync();
        return (user, membership);
    }

    [Fact]
    public async Task RemoveMember_WithValidMember_ShouldReturn204NoContent()
    {
        // Arrange
        var (user, _) = await CreateMemberAsync(OrganizationRole.User);

        // Act
        var result = await _controller.RemoveMember(_organizationId, user.Id, CancellationToken.None);

        // Assert
        var noContentResult = result.Should().BeOfType<NoContentResult>().Subject;
        noContentResult.StatusCode.Should().Be(204);
    }

    [Fact]
    public async Task RemoveMember_WithValidMember_ShouldRemoveMembershipFromDatabase()
    {
        // Arrange
        var (user, _) = await CreateMemberAsync(OrganizationRole.User);

        // Act
        await _controller.RemoveMember(_organizationId, user.Id, CancellationToken.None);

        // Assert
        var membershipExists = await _context.OrganizationMembers
            .AnyAsync(m => m.UserId == user.Id && m.OrganizationId == _organizationId);
        membershipExists.Should().BeFalse();
    }

    [Fact]
    public async Task RemoveMember_WithValidMember_ShouldNotDeleteUser()
    {
        // Arrange
        var (user, _) = await CreateMemberAsync(OrganizationRole.User);

        // Act
        await _controller.RemoveMember(_organizationId, user.Id, CancellationToken.None);

        // Assert
        var userExists = await _context.Users.AnyAsync(u => u.Id == user.Id);
        userExists.Should().BeTrue();
    }

    [Fact]
    public async Task RemoveMember_WithNonExistentOrganization_ShouldThrowNotFoundException()
    {
        // Arrange
        var nonExistentOrgId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        // Act
        var act = () => _controller.RemoveMember(nonExistentOrgId, userId, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"*Organization*{nonExistentOrgId}*not found*");
    }

    [Fact]
    public async Task RemoveMember_WithNonExistentMember_ShouldThrowNotFoundException()
    {
        // Arrange
        var nonExistentUserId = Guid.NewGuid();

        // Act
        var act = () => _controller.RemoveMember(_organizationId, nonExistentUserId, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"*User*{nonExistentUserId}*not a member*{_organizationId}*");
    }

    [Fact]
    public async Task RemoveMember_WhenRemovingLastAdmin_ShouldThrowBusinessRuleException()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "lastadmin");

        // Act
        var act = () => _controller.RemoveMember(_organizationId, admin.Id, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("*Cannot remove the last administrator*");
    }

    [Fact]
    public async Task RemoveMember_WhenRemovingAdminWithOtherAdmins_ShouldSucceed()
    {
        // Arrange
        var (admin1, _) = await CreateMemberAsync(OrganizationRole.Admin, "admin1");
        var (admin2, _) = await CreateMemberAsync(OrganizationRole.Admin, "admin2");

        // Act
        var result = await _controller.RemoveMember(_organizationId, admin1.Id, CancellationToken.None);

        // Assert
        result.Should().BeOfType<NoContentResult>();
        var membershipExists = await _context.OrganizationMembers
            .AnyAsync(m => m.UserId == admin1.Id && m.OrganizationId == _organizationId);
        membershipExists.Should().BeFalse();

        // Verify second admin still exists
        var admin2Exists = await _context.OrganizationMembers
            .AnyAsync(m => m.UserId == admin2.Id && m.OrganizationId == _organizationId);
        admin2Exists.Should().BeTrue();
    }

    [Fact]
    public async Task RemoveMember_WhenRemovingManager_ShouldSucceed()
    {
        // Arrange
        var (manager, _) = await CreateMemberAsync(OrganizationRole.Manager, "manager");

        // Act
        var result = await _controller.RemoveMember(_organizationId, manager.Id, CancellationToken.None);

        // Assert
        result.Should().BeOfType<NoContentResult>();
        var membershipExists = await _context.OrganizationMembers
            .AnyAsync(m => m.UserId == manager.Id && m.OrganizationId == _organizationId);
        membershipExists.Should().BeFalse();
    }

    [Fact]
    public async Task RemoveMember_WhenLastAdminButOtherRolesExist_ShouldThrowBusinessRuleException()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "onlyadmin");
        await CreateMemberAsync(OrganizationRole.Manager, "manager");
        await CreateMemberAsync(OrganizationRole.User, "user");

        // Act
        var act = () => _controller.RemoveMember(_organizationId, admin.Id, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("*Cannot remove the last administrator*");
    }

    #endregion

    #region DeactivateMember Tests

    private void SetCallerContext(Guid userId, Guid? orgId = null)
    {
        var claims = new List<Claim>
        {
            new Claim("org_id", (orgId ?? _organizationId).ToString()),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, "admin")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        _controller.ControllerContext.HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(identity)
        };
    }

    [Fact]
    public async Task DeactivateMember_WithValidRequest_ShouldReturn200Ok()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "calleradmin");
        var (targetUser, _) = await CreateMemberAsync(OrganizationRole.User, "targetuser");
        SetCallerContext(admin.Id);

        // Act
        var result = await _controller.DeactivateMember(_organizationId, targetUser.Id, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.IsActive.Should().BeFalse();
        response.Id.Should().Be(targetUser.Id);
    }

    [Fact]
    public async Task DeactivateMember_WithNonExistentOrganization_ShouldThrow404()
    {
        // Arrange
        var nonExistentOrgId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var callerId = Guid.NewGuid();
        SetCallerContext(callerId, nonExistentOrgId);

        // Act
        var act = () => _controller.DeactivateMember(nonExistentOrgId, userId, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"*Organization*{nonExistentOrgId}*not found*");
    }

    [Fact]
    public async Task DeactivateMember_WithNonExistentMember_ShouldThrow404()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "calleradmin2");
        var nonExistentUserId = Guid.NewGuid();
        SetCallerContext(admin.Id);

        // Act
        var act = () => _controller.DeactivateMember(_organizationId, nonExistentUserId, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"*User*{nonExistentUserId}*not a member*{_organizationId}*");
    }

    [Fact]
    public async Task DeactivateMember_ForOwnAccount_ShouldThrow422()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "selfadmin");
        SetCallerContext(admin.Id);

        // Act
        var act = () => _controller.DeactivateMember(_organizationId, admin.Id, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("*cannot deactivate your own account*");
    }

    [Fact]
    public async Task DeactivateMember_ForLastActiveAdmin_ShouldThrow422()
    {
        // Arrange: create manager (caller) and the only admin (target)
        var (manager, _) = await CreateMemberAsync(OrganizationRole.Manager, "managercaller");
        var (lastAdmin, _) = await CreateMemberAsync(OrganizationRole.Admin, "lastadmin");
        SetCallerContext(manager.Id);

        // Act
        var act = () => _controller.DeactivateMember(_organizationId, lastAdmin.Id, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("*Cannot deactivate the last active administrator*");
    }

    [Fact]
    public async Task DeactivateMember_WhenAlreadyDeactivated_ShouldSucceedIdempotently()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "idempotentadmin");
        var (targetUser, _) = await CreateMemberAsync(OrganizationRole.User, "idempotenttarget");

        // Deactivate first time
        targetUser.IsActive = false;
        await _context.SaveChangesAsync();

        SetCallerContext(admin.Id);

        // Act - second deactivation
        var result = await _controller.DeactivateMember(_organizationId, targetUser.Id, CancellationToken.None);

        // Assert - should succeed
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task DeactivateMember_ShouldRevokeAllRefreshTokens()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "revokeadmin");
        var (targetUser, _) = await CreateMemberAsync(OrganizationRole.User, "revoketarget");

        // Create some refresh tokens for the target user
        var token1 = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = targetUser.Id,
            TokenHash = "hash1",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            RevokedAt = null
        };
        var token2 = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = targetUser.Id,
            TokenHash = "hash2",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            RevokedAt = null
        };
        _context.RefreshTokens.AddRange(token1, token2);
        await _context.SaveChangesAsync();

        SetCallerContext(admin.Id);

        // Act
        await _controller.DeactivateMember(_organizationId, targetUser.Id, CancellationToken.None);

        // Assert
        var tokens = await _context.RefreshTokens
            .Where(t => t.UserId == targetUser.Id)
            .ToListAsync();

        tokens.Should().HaveCount(2);
        tokens.Should().AllSatisfy(t =>
        {
            t.RevokedAt.Should().NotBeNull();
            t.RevokedReason.Should().Be(RevokedReasons.AccountDeactivated);
        });
    }

    [Fact]
    public async Task DeactivateMember_ShouldSetIsActiveFalse()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "isactiveadmin");
        var (targetUser, _) = await CreateMemberAsync(OrganizationRole.User, "isactivetarget");
        targetUser.IsActive.Should().BeTrue(); // Verify initial state
        SetCallerContext(admin.Id);

        // Act
        await _controller.DeactivateMember(_organizationId, targetUser.Id, CancellationToken.None);

        // Assert
        var updatedUser = await _context.Users.FirstAsync(u => u.Id == targetUser.Id);
        updatedUser.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task DeactivateMember_WhenAdminWithOtherActiveAdmins_ShouldSucceed()
    {
        // Arrange
        var (admin1, _) = await CreateMemberAsync(OrganizationRole.Admin, "multipleadmin1");
        var (admin2, _) = await CreateMemberAsync(OrganizationRole.Admin, "multipleadmin2");
        SetCallerContext(admin1.Id);

        // Act
        var result = await _controller.DeactivateMember(_organizationId, admin2.Id, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.IsActive.Should().BeFalse();

        // Verify in database
        var updatedUser = await _context.Users.FirstAsync(u => u.Id == admin2.Id);
        updatedUser.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task DeactivateMember_WithDifferentOrganization_ShouldThrow403()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "difforgadmin");
        var (targetUser, _) = await CreateMemberAsync(OrganizationRole.User, "difforgtarget");

        // Set caller context with a different org ID
        var differentOrgId = Guid.NewGuid();
        SetCallerContext(admin.Id, differentOrgId);

        // Act
        var act = () => _controller.DeactivateMember(_organizationId, targetUser.Id, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("*deactivate members*");
    }

    [Fact]
    public async Task DeactivateMember_ShouldReturnUserInfoWithCorrectFields()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "fieldsadmin");

        var targetUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "fields@test.com",
            Username = "fieldsuser",
            PasswordHash = "hash",
            FirstName = "Fields",
            LastName = "Test",
            Position = "Developer",
            IsActive = true
        };
        var targetMembership = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = _organizationId,
            UserId = targetUser.Id,
            OrganizationRole = OrganizationRole.User,
            JoinedAt = DateTime.UtcNow
        };
        _context.Users.Add(targetUser);
        _context.OrganizationMembers.Add(targetMembership);
        await _context.SaveChangesAsync();

        SetCallerContext(admin.Id);

        // Act
        var result = await _controller.DeactivateMember(_organizationId, targetUser.Id, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;

        response.Id.Should().Be(targetUser.Id);
        response.Email.Should().Be("fields@test.com");
        response.Username.Should().Be("fieldsuser");
        response.FirstName.Should().Be("Fields");
        response.LastName.Should().Be("Test");
        response.OrganizationRole.Should().Be(OrganizationRole.User);
        response.IsActive.Should().BeFalse();
    }

    #endregion

    #region ActivateMember Tests

    [Fact]
    public async Task ActivateMember_WithValidRequest_ShouldReturn200Ok()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "activateadmin");
        var (targetUser, _) = await CreateMemberAsync(OrganizationRole.User, "activatetarget");
        targetUser.IsActive = false;
        await _context.SaveChangesAsync();
        SetCallerContext(admin.Id);

        // Act
        var result = await _controller.ActivateMember(_organizationId, targetUser.Id, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.IsActive.Should().BeTrue();
        response.Id.Should().Be(targetUser.Id);
    }

    [Fact]
    public async Task ActivateMember_WithNonExistentOrganization_ShouldThrow404()
    {
        // Arrange
        var nonExistentOrgId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var callerId = Guid.NewGuid();
        SetCallerContext(callerId, nonExistentOrgId);

        // Act
        var act = () => _controller.ActivateMember(nonExistentOrgId, userId, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"*Organization*{nonExistentOrgId}*not found*");
    }

    [Fact]
    public async Task ActivateMember_WithNonExistentMember_ShouldThrow404()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "activateadmin2");
        var nonExistentUserId = Guid.NewGuid();
        SetCallerContext(admin.Id);

        // Act
        var act = () => _controller.ActivateMember(_organizationId, nonExistentUserId, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"*User*{nonExistentUserId}*not a member*{_organizationId}*");
    }

    [Fact]
    public async Task ActivateMember_WhenAlreadyActive_ShouldThrow422()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "alreadyactiveadmin");
        var (targetUser, _) = await CreateMemberAsync(OrganizationRole.User, "alreadyactivetarget");
        targetUser.IsActive.Should().BeTrue(); // Verify initial state
        SetCallerContext(admin.Id);

        // Act
        var act = () => _controller.ActivateMember(_organizationId, targetUser.Id, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("*already active*");
    }

    [Fact]
    public async Task ActivateMember_ShouldSetIsActiveTrue()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "setactiveadmin");
        var (targetUser, _) = await CreateMemberAsync(OrganizationRole.User, "setactivetarget");
        targetUser.IsActive = false;
        await _context.SaveChangesAsync();
        SetCallerContext(admin.Id);

        // Act
        await _controller.ActivateMember(_organizationId, targetUser.Id, CancellationToken.None);

        // Assert
        var updatedUser = await _context.Users.FirstAsync(u => u.Id == targetUser.Id);
        updatedUser.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task ActivateMember_WithDifferentOrganization_ShouldThrow403()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "activatedifforgadmin");
        var (targetUser, _) = await CreateMemberAsync(OrganizationRole.User, "activatedifforgtarget");
        targetUser.IsActive = false;
        await _context.SaveChangesAsync();

        // Set caller context with a different org ID
        var differentOrgId = Guid.NewGuid();
        SetCallerContext(admin.Id, differentOrgId);

        // Act
        var act = () => _controller.ActivateMember(_organizationId, targetUser.Id, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("*activate members*");
    }

    [Fact]
    public async Task ActivateMember_ShouldReturnUserInfoWithCorrectFields()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "activatefieldsadmin");

        var targetUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "activatefields@test.com",
            Username = "activatefieldsuser",
            PasswordHash = "hash",
            FirstName = "Activate",
            LastName = "Fields",
            Position = "Developer",
            IsActive = false
        };
        var targetMembership = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = _organizationId,
            UserId = targetUser.Id,
            OrganizationRole = OrganizationRole.User,
            JoinedAt = DateTime.UtcNow
        };
        _context.Users.Add(targetUser);
        _context.OrganizationMembers.Add(targetMembership);
        await _context.SaveChangesAsync();

        SetCallerContext(admin.Id);

        // Act
        var result = await _controller.ActivateMember(_organizationId, targetUser.Id, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;

        response.Id.Should().Be(targetUser.Id);
        response.Email.Should().Be("activatefields@test.com");
        response.Username.Should().Be("activatefieldsuser");
        response.FirstName.Should().Be("Activate");
        response.LastName.Should().Be("Fields");
        response.OrganizationRole.Should().Be(OrganizationRole.User);
        response.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task ActivateMember_ShouldNotResetMustChangePassword()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "mustchangeadmin");
        var (targetUser, _) = await CreateMemberAsync(OrganizationRole.User, "mustchangetarget");
        targetUser.IsActive = false;
        targetUser.MustChangePassword = true;
        await _context.SaveChangesAsync();
        SetCallerContext(admin.Id);

        // Act
        await _controller.ActivateMember(_organizationId, targetUser.Id, CancellationToken.None);

        // Assert
        var updatedUser = await _context.Users.FirstAsync(u => u.Id == targetUser.Id);
        updatedUser.IsActive.Should().BeTrue();
        updatedUser.MustChangePassword.Should().BeTrue(); // Should NOT be reset
    }

    [Fact]
    public async Task ActivateMember_ShouldRevokeAllRefreshTokens()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "revoketokensadmin");
        var (targetUser, _) = await CreateMemberAsync(OrganizationRole.User, "revoketokenstarget");

        // Create some refresh tokens for the target user
        var token1 = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = targetUser.Id,
            TokenHash = "hash1",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            RevokedAt = null
        };
        var token2 = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = targetUser.Id,
            TokenHash = "hash2",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            RevokedAt = null
        };
        _context.RefreshTokens.AddRange(token1, token2);

        targetUser.IsActive = false;
        await _context.SaveChangesAsync();
        SetCallerContext(admin.Id);

        // Act
        await _controller.ActivateMember(_organizationId, targetUser.Id, CancellationToken.None);

        // Assert
        var tokens = await _context.RefreshTokens
            .Where(t => t.UserId == targetUser.Id)
            .ToListAsync();

        tokens.Should().HaveCount(2);
        tokens.Should().AllSatisfy(t =>
        {
            t.RevokedAt.Should().NotBeNull();
            t.RevokedReason.Should().Be(RevokedReasons.AccountReactivated);
        });
    }

    [Fact]
    public async Task ActivateMember_WithNoTokens_ShouldSucceed()
    {
        // Arrange
        var (admin, _) = await CreateMemberAsync(OrganizationRole.Admin, "notokensadmin");
        var (targetUser, _) = await CreateMemberAsync(OrganizationRole.User, "notokenstarget");
        targetUser.IsActive = false;
        await _context.SaveChangesAsync();
        SetCallerContext(admin.Id);

        // Act & Assert - should not throw
        var result = await _controller.ActivateMember(_organizationId, targetUser.Id, CancellationToken.None);

        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<UserInfo>().Subject;
        response.IsActive.Should().BeTrue();
    }

    #endregion
}
