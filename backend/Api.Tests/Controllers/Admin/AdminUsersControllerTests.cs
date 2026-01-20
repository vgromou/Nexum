using System.Security.Claims;
using Api.Common.Constants;
using Api.Configuration;
using Api.Controllers.Admin;
using Api.Data;
using Api.DTOs.Admin;
using Api.Exceptions;
using Api.Models;
using Api.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using Moq;

namespace Api.Tests.Controllers.Admin;

public class AdminUsersControllerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly FakeTimeProvider _timeProvider;
    private readonly Mock<IPasswordService> _passwordServiceMock;
    private readonly Mock<ILogger<AdminUsersController>> _loggerMock;
    private readonly AdminUsersController _controller;
    private readonly Guid _organizationId;
    private readonly Guid _adminUserId;
    private readonly Guid _targetUserId;
    private readonly Guid _adminMembershipId;
    private readonly Guid _targetMembershipId;

    public AdminUsersControllerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _context = new ApplicationDbContext(options);
        _timeProvider = new FakeTimeProvider(new DateTimeOffset(2025, 1, 15, 12, 0, 0, TimeSpan.Zero));
        _passwordServiceMock = new Mock<IPasswordService>();
        _loggerMock = new Mock<ILogger<AdminUsersController>>();

        _organizationId = Guid.NewGuid();
        _adminUserId = Guid.NewGuid();
        _targetUserId = Guid.NewGuid();
        _adminMembershipId = Guid.NewGuid();
        _targetMembershipId = Guid.NewGuid();

        // Create test organization
        var organization = new Organization
        {
            Id = _organizationId,
            Name = "Test Organization",
            Slug = "test-org"
        };
        _context.Organizations.Add(organization);

        // Create admin user
        var adminUser = new User
        {
            Id = _adminUserId,
            Email = "admin@example.com",
            Username = "adminuser",
            PasswordHash = "admin-hashed-password",
            FirstName = "Admin",
            LastName = "User",
            IsActive = true,
            MustChangePassword = false
        };
        _context.Users.Add(adminUser);

        // Create target user
        var targetUser = new User
        {
            Id = _targetUserId,
            Email = "target@example.com",
            Username = "targetuser",
            PasswordHash = "old-hashed-password",
            FirstName = "Target",
            LastName = "User",
            IsActive = true,
            MustChangePassword = false
        };
        _context.Users.Add(targetUser);

        // Create admin membership
        var adminMembership = new OrganizationMember
        {
            Id = _adminMembershipId,
            OrganizationId = _organizationId,
            UserId = _adminUserId,
            OrganizationRole = OrganizationRole.Admin,
            JoinedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
        _context.OrganizationMembers.Add(adminMembership);

        // Create target user membership (same organization)
        var targetMembership = new OrganizationMember
        {
            Id = _targetMembershipId,
            OrganizationId = _organizationId,
            UserId = _targetUserId,
            OrganizationRole = OrganizationRole.User,
            JoinedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
        _context.OrganizationMembers.Add(targetMembership);

        _context.SaveChanges();

        // Setup password service mock
        _passwordServiceMock
            .Setup(p => p.GenerateTemporaryPassword(It.IsAny<int>()))
            .Returns("TempPass123!@#$");
        _passwordServiceMock
            .Setup(p => p.HashPassword(It.IsAny<string>()))
            .Returns("new-hashed-password");

        var securitySettings = Options.Create(new SecuritySettings());
        _controller = new AdminUsersController(
            _context,
            _passwordServiceMock.Object,
            _timeProvider,
            securitySettings,
            _loggerMock.Object);
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    private void SetupAuthenticatedAdmin(Guid? userId = null, Guid? organizationId = null)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, "admin")
        };

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

    #region ResetPassword Success Tests

    [Fact]
    public async Task ResetPassword_WithValidRequest_ShouldReturn200Ok()
    {
        // Arrange
        SetupAuthenticatedAdmin(_adminUserId, _organizationId);

        // Act
        var result = await _controller.ResetPassword(_targetUserId, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ResetPasswordResponse>().Subject;
        response.UserId.Should().Be(_targetUserId);
        response.TemporaryPassword.Should().Be("TempPass123!@#$");
        response.Message.Should().Contain("Password reset successfully");
    }

    [Fact]
    public async Task ResetPassword_ShouldSetMustChangePasswordFlag()
    {
        // Arrange
        SetupAuthenticatedAdmin(_adminUserId, _organizationId);

        // Act
        await _controller.ResetPassword(_targetUserId, CancellationToken.None);

        // Assert
        var user = await _context.Users.FirstAsync(u => u.Id == _targetUserId);
        user.MustChangePassword.Should().BeTrue();
    }

    [Fact]
    public async Task ResetPassword_ShouldUpdatePasswordHash()
    {
        // Arrange
        SetupAuthenticatedAdmin(_adminUserId, _organizationId);

        // Act
        await _controller.ResetPassword(_targetUserId, CancellationToken.None);

        // Assert
        var user = await _context.Users.FirstAsync(u => u.Id == _targetUserId);
        user.PasswordHash.Should().Be("new-hashed-password");
    }

    [Fact]
    public async Task ResetPassword_ShouldUpdatePasswordChangedAt()
    {
        // Arrange
        SetupAuthenticatedAdmin(_adminUserId, _organizationId);
        var expectedTime = _timeProvider.GetUtcNow().UtcDateTime;

        // Act
        await _controller.ResetPassword(_targetUserId, CancellationToken.None);

        // Assert
        var user = await _context.Users.FirstAsync(u => u.Id == _targetUserId);
        user.PasswordChangedAt.Should().Be(expectedTime);
    }

    [Fact]
    public async Task ResetPassword_ShouldRevokeAllUserRefreshTokens()
    {
        // Arrange
        SetupAuthenticatedAdmin(_adminUserId, _organizationId);

        // Create some active refresh tokens for the target user
        var token1 = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = _targetUserId,
            TokenHash = "hash1",
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        var token2 = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = _targetUserId,
            TokenHash = "hash2",
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        _context.RefreshTokens.AddRange(token1, token2);
        await _context.SaveChangesAsync();

        // Act
        await _controller.ResetPassword(_targetUserId, CancellationToken.None);

        // Assert
        var tokens = await _context.RefreshTokens
            .Where(t => t.UserId == _targetUserId)
            .ToListAsync();

        tokens.Should().HaveCount(2);
        tokens.Should().AllSatisfy(t =>
        {
            t.RevokedAt.Should().NotBeNull();
            t.RevokedReason.Should().Be(RevokedReasons.PasswordReset);
        });
    }

    [Fact]
    public async Task ResetPassword_ShouldNotRevokeAlreadyRevokedTokens()
    {
        // Arrange
        SetupAuthenticatedAdmin(_adminUserId, _organizationId);

        // Create an already revoked token
        var alreadyRevokedTime = DateTime.UtcNow.AddHours(-1);
        var revokedToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = _targetUserId,
            TokenHash = "revoked-hash",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            RevokedAt = alreadyRevokedTime,
            RevokedReason = RevokedReasons.Logout
        };
        _context.RefreshTokens.Add(revokedToken);
        await _context.SaveChangesAsync();

        // Act
        await _controller.ResetPassword(_targetUserId, CancellationToken.None);

        // Assert
        var token = await _context.RefreshTokens.FirstAsync(t => t.Id == revokedToken.Id);
        token.RevokedAt.Should().Be(alreadyRevokedTime);
        token.RevokedReason.Should().Be(RevokedReasons.Logout);
    }

    [Fact]
    public async Task ResetPassword_ShouldCallPasswordServiceWithCorrectLength()
    {
        // Arrange
        SetupAuthenticatedAdmin(_adminUserId, _organizationId);

        // Act
        await _controller.ResetPassword(_targetUserId, CancellationToken.None);

        // Assert
        _passwordServiceMock.Verify(p => p.GenerateTemporaryPassword(16), Times.Once);
    }

    [Fact]
    public async Task ResetPassword_ShouldHashGeneratedPassword()
    {
        // Arrange
        SetupAuthenticatedAdmin(_adminUserId, _organizationId);

        // Act
        await _controller.ResetPassword(_targetUserId, CancellationToken.None);

        // Assert
        _passwordServiceMock.Verify(p => p.HashPassword("TempPass123!@#$"), Times.Once);
    }

    #endregion

    #region ResetPassword Forbidden Tests

    [Fact]
    public async Task ResetPassword_WhenUserNotInSameOrganization_ShouldThrow403Forbidden()
    {
        // Arrange
        var otherOrgId = Guid.NewGuid();
        var otherOrg = new Organization
        {
            Id = otherOrgId,
            Name = "Other Organization",
            Slug = "other-org"
        };
        _context.Organizations.Add(otherOrg);

        var userInOtherOrg = new User
        {
            Id = Guid.NewGuid(),
            Email = "other@example.com",
            Username = "otheruser",
            PasswordHash = "hash",
            FirstName = "Other",
            LastName = "User",
            IsActive = true
        };
        _context.Users.Add(userInOtherOrg);

        var otherMembership = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = otherOrgId,
            UserId = userInOtherOrg.Id,
            OrganizationRole = OrganizationRole.User,
            JoinedAt = DateTime.UtcNow
        };
        _context.OrganizationMembers.Add(otherMembership);
        await _context.SaveChangesAsync();

        SetupAuthenticatedAdmin(_adminUserId, _organizationId);

        // Act
        var act = () => _controller.ResetPassword(userInOtherOrg.Id, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("*reset password for users outside your organization*");
    }

    [Fact]
    public async Task ResetPassword_WhenUserHasNoOrganization_ShouldThrow403Forbidden()
    {
        // Arrange
        var userWithNoOrg = new User
        {
            Id = Guid.NewGuid(),
            Email = "noorg@example.com",
            Username = "noorguser",
            PasswordHash = "hash",
            FirstName = "NoOrg",
            LastName = "User",
            IsActive = true
        };
        _context.Users.Add(userWithNoOrg);
        await _context.SaveChangesAsync();

        SetupAuthenticatedAdmin(_adminUserId, _organizationId);

        // Act
        var act = () => _controller.ResetPassword(userWithNoOrg.Id, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    #endregion

    #region ResetPassword NotFound Tests

    [Fact]
    public async Task ResetPassword_WhenUserNotFound_ShouldThrow404NotFound()
    {
        // Arrange
        SetupAuthenticatedAdmin(_adminUserId, _organizationId);
        var nonExistentUserId = Guid.NewGuid();

        // Act
        var act = () => _controller.ResetPassword(nonExistentUserId, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"*User*{nonExistentUserId}*not found*");
    }

    #endregion

    #region ResetPassword Unauthorized Tests

    [Fact]
    public async Task ResetPassword_WithoutUserId_ShouldThrowUnauthorizedException()
    {
        // Arrange
        SetupAuthenticatedAdmin(null, _organizationId);

        // Act
        var act = () => _controller.ResetPassword(_targetUserId, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*user ID or organization ID not found*");
    }

    [Fact]
    public async Task ResetPassword_WithoutOrganizationId_ShouldThrowUnauthorizedException()
    {
        // Arrange
        SetupAuthenticatedAdmin(_adminUserId, null);

        // Act
        var act = () => _controller.ResetPassword(_targetUserId, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*user ID or organization ID not found*");
    }

    [Fact]
    public async Task ResetPassword_WithNoClaims_ShouldThrowUnauthorizedException()
    {
        // Arrange
        SetupAuthenticatedAdmin(null, null);

        // Act
        var act = () => _controller.ResetPassword(_targetUserId, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>();
    }

    #endregion

    #region ResetPassword Edge Cases

    [Fact]
    public async Task ResetPassword_WhenUserHasNoActiveTokens_ShouldSucceed()
    {
        // Arrange
        SetupAuthenticatedAdmin(_adminUserId, _organizationId);
        // Target user has no refresh tokens

        // Act
        var result = await _controller.ResetPassword(_targetUserId, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeOfType<ResetPasswordResponse>();
    }

    [Fact]
    public async Task ResetPassword_AdminCanResetOwnPassword()
    {
        // Arrange
        SetupAuthenticatedAdmin(_adminUserId, _organizationId);

        // Act
        var result = await _controller.ResetPassword(_adminUserId, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ResetPasswordResponse>().Subject;
        response.UserId.Should().Be(_adminUserId);
    }

    [Fact]
    public async Task ResetPassword_ShouldNotAffectOtherUsersTokens()
    {
        // Arrange
        SetupAuthenticatedAdmin(_adminUserId, _organizationId);

        // Create a token for the admin user
        var adminToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = _adminUserId,
            TokenHash = "admin-hash",
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        _context.RefreshTokens.Add(adminToken);
        await _context.SaveChangesAsync();

        // Act
        await _controller.ResetPassword(_targetUserId, CancellationToken.None);

        // Assert
        var token = await _context.RefreshTokens.FirstAsync(t => t.Id == adminToken.Id);
        token.RevokedAt.Should().BeNull();
    }

    #endregion
}
