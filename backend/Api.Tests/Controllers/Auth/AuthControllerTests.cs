using System.Net;
using System.Security.Claims;
using Api.Common.Constants;
using Api.Common.Errors;
using Api.Configuration;
using Api.Controllers.Auth;
using Api.Data;
using Api.DTOs.Auth;
using Api.Exceptions;
using Api.Models;
using Api.Services;
using AwesomeAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Microsoft.Extensions.Time.Testing;
using Moq;

namespace Api.Tests.Controllers.Auth;

public class AuthControllerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<IJwtService> _jwtServiceMock;
    private readonly Mock<IPasswordService> _passwordServiceMock;
    private readonly FakeTimeProvider _timeProvider;
    private readonly IOptions<SecuritySettings> _securitySettings;
    private readonly Mock<ILogger<AuthController>> _loggerMock;
    private readonly AuthController _controller;
    private readonly Guid _organizationId;
    private readonly Guid _userId;

    public AuthControllerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _context = new ApplicationDbContext(options);
        _jwtServiceMock = new Mock<IJwtService>();
        _passwordServiceMock = new Mock<IPasswordService>();
        _timeProvider = new FakeTimeProvider(new DateTimeOffset(2025, 1, 15, 12, 0, 0, TimeSpan.Zero));
        _securitySettings = Options.Create(new SecuritySettings
        {
            MaxFailedLoginAttempts = 5,
            LockoutDurationMinutes = 15
        });
        _loggerMock = new Mock<ILogger<AuthController>>();

        // Setup JWT service mock
        _jwtServiceMock.Setup(j => j.GenerateAccessToken(It.IsAny<User>(), It.IsAny<OrganizationMember>()))
            .Returns("test-access-token");
        _jwtServiceMock.Setup(j => j.GenerateRefreshToken())
            .Returns("test-refresh-token");
        _jwtServiceMock.Setup(j => j.AccessTokenExpiration)
            .Returns(TimeSpan.FromMinutes(15));
        _jwtServiceMock.Setup(j => j.RefreshTokenExpiration)
            .Returns(TimeSpan.FromDays(7));

        // Setup password service mock
        _passwordServiceMock.Setup(p => p.VerifyPassword(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(false);
        _passwordServiceMock.Setup(p => p.VerifyPassword("correct-password", It.IsAny<string>()))
            .Returns(true);

        // Create test organization
        _organizationId = Guid.NewGuid();
        var organization = new Organization
        {
            Id = _organizationId,
            Name = "Test Organization",
            Slug = "test-org"
        };
        _context.Organizations.Add(organization);

        // Create test user
        _userId = Guid.NewGuid();
        var user = new User
        {
            Id = _userId,
            Email = "test@example.com",
            Username = "testuser",
            PasswordHash = "hashed-password",
            FirstName = "Test",
            LastName = "User",
            IsActive = true
        };
        _context.Users.Add(user);

        // Create membership
        var membership = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = _organizationId,
            UserId = _userId,
            OrganizationRole = OrganizationRole.User,
            JoinedAt = _timeProvider.GetUtcNow().UtcDateTime
        };
        _context.OrganizationMembers.Add(membership);
        _context.SaveChanges();

        _controller = new AuthController(
            _context,
            _jwtServiceMock.Object,
            _passwordServiceMock.Object,
            _timeProvider,
            _securitySettings,
            _loggerMock.Object);

        // Setup HttpContext
        var httpContext = new DefaultHttpContext();
        httpContext.Connection.RemoteIpAddress = IPAddress.Parse("127.0.0.1");
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    #region Successful Login Tests

    [Fact]
    public async Task Login_WithValidEmailAndPassword_ShouldReturn200Ok()
    {
        // Arrange
        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "correct-password"
        };

        // Act
        var result = await _controller.Login(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<LoginResponse>().Subject;
        response.AccessToken.Should().Be("test-access-token");
        response.RefreshToken.Should().Be("test-refresh-token");
        response.User.Email.Should().Be("test@example.com");
    }

    [Fact]
    public async Task Login_WithValidUsernameAndPassword_ShouldReturn200Ok()
    {
        // Arrange
        var request = new LoginRequest
        {
            Login = "testuser",
            Password = "correct-password"
        };

        // Act
        var result = await _controller.Login(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<LoginResponse>().Subject;
        response.User.Username.Should().Be("testuser");
    }

    [Fact]
    public async Task Login_WithUppercaseEmail_ShouldSucceed()
    {
        // Arrange
        var request = new LoginRequest
        {
            Login = "TEST@EXAMPLE.COM",
            Password = "correct-password"
        };

        // Act
        var result = await _controller.Login(request, CancellationToken.None);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Login_ShouldResetFailedAttemptsOnSuccess()
    {
        // Arrange
        var user = await _context.Users.FirstAsync(u => u.Email == "test@example.com");
        user.FailedLoginAttempts = 3;
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "correct-password"
        };

        // Act
        await _controller.Login(request, CancellationToken.None);

        // Assert
        var updatedUser = await _context.Users.FirstAsync(u => u.Email == "test@example.com");
        updatedUser.FailedLoginAttempts.Should().Be(0);
        updatedUser.LockoutUntil.Should().BeNull();
    }

    [Fact]
    public async Task Login_ShouldUpdateLastLoginAt()
    {
        // Arrange
        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "correct-password"
        };

        // Act
        await _controller.Login(request, CancellationToken.None);

        // Assert
        var user = await _context.Users.FirstAsync(u => u.Email == "test@example.com");
        user.LastLoginAt.Should().Be(_timeProvider.GetUtcNow().UtcDateTime);
    }

    [Fact]
    public async Task Login_ShouldCreateRefreshTokenInDatabase()
    {
        // Arrange
        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "correct-password"
        };

        // Act
        await _controller.Login(request, CancellationToken.None);

        // Assert
        var refreshToken = await _context.RefreshTokens.FirstOrDefaultAsync(r => r.UserId == _userId);
        refreshToken.Should().NotBeNull();
        refreshToken!.IpAddress.Should().NotBeNull();
    }

    [Fact]
    public async Task Login_ShouldLogSuccessfulAttempt()
    {
        // Arrange
        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "correct-password"
        };

        // Act
        await _controller.Login(request, CancellationToken.None);

        // Assert
        var attempt = await _context.LoginAttempts.FirstOrDefaultAsync(a => a.LoginIdentifier == "test@example.com");
        attempt.Should().NotBeNull();
        attempt!.Success.Should().BeTrue();
        attempt.FailureReason.Should().BeNull();
    }

    #endregion

    #region Invalid Credentials Tests

    [Fact]
    public async Task Login_WithNonExistentEmail_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var request = new LoginRequest
        {
            Login = "nonexistent@example.com",
            Password = "any-password"
        };

        // Act
        var act = () => _controller.Login(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*Invalid login or password*");
    }

    [Fact]
    public async Task Login_WithWrongPassword_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "wrong-password"
        };

        // Act
        var act = () => _controller.Login(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*Invalid login or password*");
    }

    [Fact]
    public async Task Login_WithWrongPassword_ShouldIncrementFailedAttempts()
    {
        // Arrange
        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "wrong-password"
        };

        // Act
        try { await _controller.Login(request, CancellationToken.None); } catch { }

        // Assert
        var user = await _context.Users.FirstAsync(u => u.Email == "test@example.com");
        user.FailedLoginAttempts.Should().Be(1);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ShouldLogFailedAttempt()
    {
        // Arrange
        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "wrong-password"
        };

        // Act
        try { await _controller.Login(request, CancellationToken.None); } catch { }

        // Assert
        var attempt = await _context.LoginAttempts.FirstOrDefaultAsync(a => a.LoginIdentifier == "test@example.com");
        attempt.Should().NotBeNull();
        attempt!.Success.Should().BeFalse();
        attempt.FailureReason.Should().Be("Invalid password");
    }

    #endregion

    #region Account Lockout Tests

    [Fact]
    public async Task Login_After5FailedAttempts_ShouldLockAccount()
    {
        // Arrange
        var user = await _context.Users.FirstAsync(u => u.Email == "test@example.com");
        user.FailedLoginAttempts = 4; // Will be 5 after this attempt
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "wrong-password"
        };

        // Act
        try { await _controller.Login(request, CancellationToken.None); } catch { }

        // Assert
        var updatedUser = await _context.Users.FirstAsync(u => u.Email == "test@example.com");
        updatedUser.FailedLoginAttempts.Should().Be(5);
        updatedUser.LockoutUntil.Should().Be(_timeProvider.GetUtcNow().UtcDateTime.AddMinutes(15));
    }

    [Fact]
    public async Task Login_WithLockedAccount_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var user = await _context.Users.FirstAsync(u => u.Email == "test@example.com");
        user.LockoutUntil = _timeProvider.GetUtcNow().UtcDateTime.AddMinutes(10);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "correct-password"
        };

        // Act
        var act = () => _controller.Login(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*Account is locked*");
    }

    [Fact]
    public async Task Login_WithExpiredLockout_ShouldSucceed()
    {
        // Arrange
        var user = await _context.Users.FirstAsync(u => u.Email == "test@example.com");
        user.LockoutUntil = _timeProvider.GetUtcNow().UtcDateTime.AddMinutes(-1); // Expired
        user.FailedLoginAttempts = 5;
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "correct-password"
        };

        // Act
        var result = await _controller.Login(request, CancellationToken.None);

        // Assert
        result.Result.Should().BeOfType<OkObjectResult>();
    }

    #endregion

    #region Deactivated Account Tests

    [Fact]
    public async Task Login_WithDeactivatedAccount_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var user = await _context.Users.FirstAsync(u => u.Email == "test@example.com");
        user.IsActive = false;
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "correct-password"
        };

        // Act
        var act = () => _controller.Login(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*deactivated*");
    }

    #endregion

    #region No Organization Membership Tests

    [Fact]
    public async Task Login_WithUserWithoutOrganization_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var userWithoutOrg = new User
        {
            Id = Guid.NewGuid(),
            Email = "noorg@example.com",
            Username = "noorguser",
            PasswordHash = "hash",
            FirstName = "No",
            LastName = "Org",
            IsActive = true
        };
        _context.Users.Add(userWithoutOrg);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Login = "noorg@example.com",
            Password = "correct-password"
        };

        // Act
        var act = () => _controller.Login(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>();
    }

    #endregion

    #region Response Content Tests

    [Fact]
    public async Task Login_ShouldReturnCorrectExpiresIn()
    {
        // Arrange
        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "correct-password"
        };

        // Act
        var result = await _controller.Login(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<LoginResponse>().Subject;
        response.ExpiresIn.Should().Be(900); // 15 minutes in seconds
        response.TokenType.Should().Be("Bearer");
    }

    [Fact]
    public async Task Login_WithMustChangePassword_ShouldReturnFlag()
    {
        // Arrange
        var user = await _context.Users.FirstAsync(u => u.Email == "test@example.com");
        user.MustChangePassword = true;
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "correct-password"
        };

        // Act
        var result = await _controller.Login(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<LoginResponse>().Subject;
        response.MustChangePassword.Should().BeTrue();
        response.User.MustChangePassword.Should().BeTrue();
    }

    #endregion

    #region IP Address Tests

    [Fact]
    public async Task Login_ShouldCaptureIpAddress()
    {
        // Arrange
        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "correct-password"
        };

        // Act
        await _controller.Login(request, CancellationToken.None);

        // Assert
        var attempt = await _context.LoginAttempts.FirstAsync();
        attempt.IpAddress.Should().Be(IPAddress.Parse("127.0.0.1"));
    }

    [Fact]
    public async Task Login_WithForwardedIp_ShouldUseRemoteIpAddress()
    {
        // Arrange
        // Note: In production, the ForwardedHeaders middleware processes X-Forwarded-For
        // and sets Connection.RemoteIpAddress. In unit tests, we simulate this by
        // setting RemoteIpAddress directly.
        var httpContext = new DefaultHttpContext();
        httpContext.Connection.RemoteIpAddress = IPAddress.Parse("192.168.1.100");
        _controller.ControllerContext.HttpContext = httpContext;

        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "correct-password"
        };

        // Act
        await _controller.Login(request, CancellationToken.None);

        // Assert
        var attempt = await _context.LoginAttempts.FirstAsync();
        attempt.IpAddress.Should().Be(IPAddress.Parse("192.168.1.100"));
    }

    #endregion

    #region Configurable Lockout Tests

    [Fact]
    public async Task Login_ShouldUseConfiguredLockoutSettings()
    {
        // Arrange - use custom settings
        var customSettings = Options.Create(new SecuritySettings
        {
            MaxFailedLoginAttempts = 3,
            LockoutDurationMinutes = 30
        });

        var controller = new AuthController(
            _context,
            _jwtServiceMock.Object,
            _passwordServiceMock.Object,
            _timeProvider,
            customSettings,
            _loggerMock.Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                Connection = { RemoteIpAddress = IPAddress.Loopback }
            }
        };

        var user = await _context.Users.FirstAsync(u => u.Email == "test@example.com");
        user.FailedLoginAttempts = 2; // Will be 3 after this attempt
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "wrong-password"
        };

        // Act
        try { await controller.Login(request, CancellationToken.None); } catch { }

        // Assert
        var updatedUser = await _context.Users.FirstAsync(u => u.Email == "test@example.com");
        updatedUser.FailedLoginAttempts.Should().Be(3);
        updatedUser.LockoutUntil.Should().Be(_timeProvider.GetUtcNow().UtcDateTime.AddMinutes(30));
    }

    #endregion

    #region Logout Tests

    [Fact]
    public async Task Logout_WithValidToken_ShouldRevokeToken()
    {
        // Arrange
        var refreshTokenValue = "test-refresh-token";
        var tokenHash = ComputeTokenHash(refreshTokenValue);
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            TokenHash = tokenHash,
            ExpiresAt = _timeProvider.GetUtcNow().UtcDateTime.AddDays(7),
            DeviceInfo = "Test",
            IpAddress = IPAddress.Loopback
        };
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        SetupAuthenticatedUser(_userId);

        var request = new LogoutRequest { RefreshToken = refreshTokenValue };

        // Act
        var result = await _controller.Logout(request, CancellationToken.None);

        // Assert
        result.Should().BeOfType<OkResult>();
        var revokedToken = await _context.RefreshTokens.FirstAsync(t => t.Id == refreshToken.Id);
        revokedToken.RevokedAt.Should().NotBeNull();
        revokedToken.RevokedReason.Should().Be("logout");
    }

    [Fact]
    public async Task Logout_WithTokenBelongingToAnotherUser_ShouldNotRevokeToken()
    {
        // Arrange
        var anotherUserId = Guid.NewGuid();
        var anotherUser = new User
        {
            Id = anotherUserId,
            Email = "another@example.com",
            Username = "anotheruser",
            PasswordHash = "hash",
            FirstName = "Another",
            LastName = "User",
            IsActive = true
        };
        _context.Users.Add(anotherUser);

        var refreshTokenValue = "other-user-token";
        var tokenHash = ComputeTokenHash(refreshTokenValue);
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = anotherUserId, // Belongs to another user
            TokenHash = tokenHash,
            ExpiresAt = _timeProvider.GetUtcNow().UtcDateTime.AddDays(7),
            DeviceInfo = "Test",
            IpAddress = IPAddress.Loopback
        };
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        SetupAuthenticatedUser(_userId); // Current user is different

        var request = new LogoutRequest { RefreshToken = refreshTokenValue };

        // Act
        var result = await _controller.Logout(request, CancellationToken.None);

        // Assert - Should return OK but NOT revoke the token (security)
        result.Should().BeOfType<OkResult>();
        var notRevokedToken = await _context.RefreshTokens.FirstAsync(t => t.Id == refreshToken.Id);
        notRevokedToken.RevokedAt.Should().BeNull(); // Token should NOT be revoked
    }

    [Fact]
    public async Task Logout_WithAlreadyRevokedToken_ShouldReturnOk()
    {
        // Arrange
        var refreshTokenValue = "revoked-token";
        var tokenHash = ComputeTokenHash(refreshTokenValue);
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            TokenHash = tokenHash,
            ExpiresAt = _timeProvider.GetUtcNow().UtcDateTime.AddDays(7),
            RevokedAt = _timeProvider.GetUtcNow().UtcDateTime.AddHours(-1),
            RevokedReason = "logout",
            DeviceInfo = "Test",
            IpAddress = IPAddress.Loopback
        };
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        SetupAuthenticatedUser(_userId);

        var request = new LogoutRequest { RefreshToken = refreshTokenValue };

        // Act
        var result = await _controller.Logout(request, CancellationToken.None);

        // Assert - Should return OK (idempotent)
        result.Should().BeOfType<OkResult>();
    }

    #endregion

    #region Refresh Token Tests

    [Fact]
    public async Task Refresh_WithValidToken_ShouldReturnNewTokens()
    {
        // Arrange
        var refreshTokenValue = "valid-refresh-token";
        var tokenHash = ComputeTokenHash(refreshTokenValue);
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            TokenHash = tokenHash,
            ExpiresAt = _timeProvider.GetUtcNow().UtcDateTime.AddDays(7),
            DeviceInfo = "Test",
            IpAddress = IPAddress.Loopback
        };
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        var request = new RefreshRequest { RefreshToken = refreshTokenValue };

        // Act
        var result = await _controller.Refresh(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<RefreshResponse>().Subject;
        response.AccessToken.Should().Be("test-access-token");
        response.RefreshToken.Should().Be("test-refresh-token");

        // Old token should be revoked
        var oldToken = await _context.RefreshTokens.FirstAsync(t => t.Id == refreshToken.Id);
        oldToken.RevokedAt.Should().NotBeNull();
        oldToken.RevokedReason.Should().Be("refresh");
    }

    [Fact]
    public async Task Refresh_WithExpiredToken_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var refreshTokenValue = "expired-refresh-token";
        var tokenHash = ComputeTokenHash(refreshTokenValue);
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            TokenHash = tokenHash,
            ExpiresAt = _timeProvider.GetUtcNow().UtcDateTime.AddDays(-1), // Expired
            DeviceInfo = "Test",
            IpAddress = IPAddress.Loopback
        };
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        var request = new RefreshRequest { RefreshToken = refreshTokenValue };

        // Act
        var act = () => _controller.Refresh(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*expired*");
    }

    [Fact]
    public async Task Refresh_WithRevokedToken_ShouldRevokeAllUserTokens()
    {
        // Arrange - Create a revoked token and an active token
        var revokedTokenValue = "revoked-token";
        var revokedTokenHash = ComputeTokenHash(revokedTokenValue);
        var revokedToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            TokenHash = revokedTokenHash,
            ExpiresAt = _timeProvider.GetUtcNow().UtcDateTime.AddDays(7),
            RevokedAt = _timeProvider.GetUtcNow().UtcDateTime.AddHours(-1),
            RevokedReason = "refresh",
            DeviceInfo = "Test",
            IpAddress = IPAddress.Loopback
        };

        var activeTokenValue = "active-token";
        var activeTokenHash = ComputeTokenHash(activeTokenValue);
        var activeToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            TokenHash = activeTokenHash,
            ExpiresAt = _timeProvider.GetUtcNow().UtcDateTime.AddDays(7),
            DeviceInfo = "Test",
            IpAddress = IPAddress.Loopback
        };

        _context.RefreshTokens.AddRange(revokedToken, activeToken);
        await _context.SaveChangesAsync();

        var request = new RefreshRequest { RefreshToken = revokedTokenValue };

        // Act - Try to reuse the revoked token
        var act = () => _controller.Refresh(request, CancellationToken.None);

        // Assert - Should throw and revoke all user tokens (security)
        await act.Should().ThrowAsync<UnauthorizedException>();

        var allTokens = await _context.RefreshTokens
            .Where(t => t.UserId == _userId)
            .ToListAsync();

        allTokens.Should().AllSatisfy(t => t.RevokedAt.Should().NotBeNull());
    }

    [Fact]
    public async Task Refresh_WithDeactivatedUser_ShouldThrowUnauthorizedException()
    {
        // Arrange
        var user = await _context.Users.FirstAsync(u => u.Id == _userId);
        user.IsActive = false;
        await _context.SaveChangesAsync();

        var refreshTokenValue = "valid-refresh-token";
        var tokenHash = ComputeTokenHash(refreshTokenValue);
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            TokenHash = tokenHash,
            ExpiresAt = _timeProvider.GetUtcNow().UtcDateTime.AddDays(7),
            DeviceInfo = "Test",
            IpAddress = IPAddress.Loopback
        };
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        var request = new RefreshRequest { RefreshToken = refreshTokenValue };

        // Act
        var act = () => _controller.Refresh(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("*deactivated*");
    }

    #endregion

    #region Session Limit Tests

    [Fact]
    public async Task Login_ShouldRevokeOldestSessionsWhenLimitExceeded()
    {
        // Arrange
        var settingsWithLimit = Options.Create(new SecuritySettings
        {
            MaxFailedLoginAttempts = 5,
            LockoutDurationMinutes = 15,
            MaxActiveSessionsPerUser = 2
        });

        var controller = new AuthController(
            _context,
            _jwtServiceMock.Object,
            _passwordServiceMock.Object,
            _timeProvider,
            settingsWithLimit,
            _loggerMock.Object);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                Connection = { RemoteIpAddress = IPAddress.Loopback }
            }
        };

        // Create 2 existing active sessions
        var oldestToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            TokenHash = "hash1",
            ExpiresAt = _timeProvider.GetUtcNow().UtcDateTime.AddDays(7),
            CreatedAt = _timeProvider.GetUtcNow().UtcDateTime.AddHours(-2),
            DeviceInfo = "Test",
            IpAddress = IPAddress.Loopback
        };
        var newerToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            TokenHash = "hash2",
            ExpiresAt = _timeProvider.GetUtcNow().UtcDateTime.AddDays(7),
            CreatedAt = _timeProvider.GetUtcNow().UtcDateTime.AddHours(-1),
            DeviceInfo = "Test",
            IpAddress = IPAddress.Loopback
        };
        _context.RefreshTokens.AddRange(oldestToken, newerToken);
        await _context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Login = "test@example.com",
            Password = "correct-password"
        };

        // Act
        await controller.Login(request, CancellationToken.None);

        // Assert - Oldest session should be revoked
        var tokens = await _context.RefreshTokens
            .Where(t => t.UserId == _userId)
            .ToListAsync();

        tokens.Count.Should().Be(3); // 2 old + 1 new
        var revokedTokens = tokens.Where(t => t.RevokedAt != null).ToList();
        revokedTokens.Should().HaveCount(1);

        // Verify the revoked token is the oldest one (has hash1)
        var revokedToken = revokedTokens.First();
        revokedToken.TokenHash.Should().Be("hash1");

        // Verify the newer token is NOT revoked
        var newerTokenFromDb = tokens.First(t => t.TokenHash == "hash2");
        newerTokenFromDb.RevokedAt.Should().BeNull();
    }

    #endregion

    #region ChangePassword Tests

    [Fact]
    public async Task ChangePassword_ShouldReturnNewTokensWithMustChangePasswordFalse()
    {
        // Arrange
        SetupAuthenticatedUser(_userId);
        _passwordServiceMock.Setup(p => p.VerifyPassword("old-password", It.IsAny<string>()))
            .Returns(true);
        _passwordServiceMock.Setup(p => p.HashPassword("new-password"))
            .Returns("new-hashed-password");

        var user = await _context.Users
            .Include(u => u.OrganizationMemberships)
            .FirstAsync(u => u.Id == _userId);
        user.MustChangePassword = true;

        await _context.SaveChangesAsync();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "old-password",
            NewPassword = "new-password"
        };

        // Act
        var result = await _controller.ChangePassword(request, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ChangePasswordResponse>().Subject;

        response.AccessToken.Should().Be("test-access-token");
        response.RefreshToken.Should().Be("test-refresh-token");
        response.ExpiresIn.Should().Be(900); // 15 minutes in seconds

        // Verify MustChangePassword is cleared
        var updatedUser = await _context.Users.FindAsync(_userId);
        updatedUser!.MustChangePassword.Should().BeFalse();
    }

    [Fact]
    public async Task ChangePassword_ShouldRevokeAllExistingRefreshTokens()
    {
        // Arrange
        SetupAuthenticatedUser(_userId);
        _passwordServiceMock.Setup(p => p.VerifyPassword("old-password", It.IsAny<string>()))
            .Returns(true);
        _passwordServiceMock.Setup(p => p.HashPassword("new-password"))
            .Returns("new-hashed-password");

        // Create multiple existing refresh tokens
        var token1 = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            TokenHash = "hash1",
            ExpiresAt = _timeProvider.GetUtcNow().UtcDateTime.AddDays(7),
            DeviceInfo = "Device 1",
            IpAddress = IPAddress.Loopback
        };
        var token2 = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            TokenHash = "hash2",
            ExpiresAt = _timeProvider.GetUtcNow().UtcDateTime.AddDays(7),
            DeviceInfo = "Device 2",
            IpAddress = IPAddress.Loopback
        };
        _context.RefreshTokens.AddRange(token1, token2);
        await _context.SaveChangesAsync();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "old-password",
            NewPassword = "new-password"
        };

        // Act
        await _controller.ChangePassword(request, CancellationToken.None);

        // Assert
        var tokens = await _context.RefreshTokens
            .Where(t => t.UserId == _userId)
            .ToListAsync();

        // Should have 2 old revoked tokens + 1 new active token
        tokens.Should().HaveCount(3);
        var revokedTokens = tokens.Where(t => t.RevokedAt != null).ToList();
        revokedTokens.Should().HaveCount(2);
        revokedTokens.Should().AllSatisfy(t => t.RevokedReason.Should().Be(RevokedReasons.PasswordChange));

        // New token should not be revoked
        var activeTokens = tokens.Where(t => t.RevokedAt == null).ToList();
        activeTokens.Should().HaveCount(1);
    }

    [Fact]
    public async Task ChangePassword_ShouldUpdatePasswordHash()
    {
        // Arrange
        SetupAuthenticatedUser(_userId);
        _passwordServiceMock.Setup(p => p.VerifyPassword("old-password", It.IsAny<string>()))
            .Returns(true);
        _passwordServiceMock.Setup(p => p.HashPassword("new-password"))
            .Returns("new-hashed-password");

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "old-password",
            NewPassword = "new-password"
        };

        // Act
        await _controller.ChangePassword(request, CancellationToken.None);

        // Assert
        var updatedUser = await _context.Users.FindAsync(_userId);
        updatedUser!.PasswordHash.Should().Be("new-hashed-password");
        updatedUser.PasswordChangedAt.Should().BeCloseTo(_timeProvider.GetUtcNow().UtcDateTime, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task ChangePassword_ShouldThrowFieldValidationWhenCurrentPasswordIsIncorrect()
    {
        // Arrange
        SetupAuthenticatedUser(_userId);
        _passwordServiceMock.Setup(p => p.VerifyPassword(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(false);

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "wrong-password",
            NewPassword = "new-password"
        };

        // Act
        var act = async () => await _controller.ChangePassword(request, CancellationToken.None);

        // Assert
        // Frontend relies on Field-typed validation errors to render inline under
        // the "Current password" input (see NX bug: no error shown on incorrect
        // current password). A Toast/Page error would clear the form silently.
        var assertion = await act.Should().ThrowAsync<ValidationException>();
        var ex = assertion.Which;
        ex.DisplayType.Should().Be(DisplayType.Field);
        ex.StatusCode.Should().Be(400);
        ex.FieldErrors.Should().ContainKey("currentPassword");
        ex.FieldErrors["currentPassword"].Should().ContainSingle()
            .Which.Code.Should().Be(ErrorCodes.AUTH_INVALID_CURRENT_PASSWORD);
    }

    [Fact]
    public async Task ChangePassword_ShouldThrowUnauthorizedWhenUserHasNoOrganizationMembership()
    {
        // Arrange
        var userWithoutMembership = new User
        {
            Id = Guid.NewGuid(),
            Email = "nomembership@example.com",
            Username = "nomembership",
            PasswordHash = "hashed-password",
            FirstName = "No",
            LastName = "Membership",
            IsActive = true,
            MustChangePassword = true
        };
        _context.Users.Add(userWithoutMembership);
        await _context.SaveChangesAsync();

        SetupAuthenticatedUser(userWithoutMembership.Id);
        _passwordServiceMock.Setup(p => p.VerifyPassword("old-password", It.IsAny<string>()))
            .Returns(true);

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "old-password",
            NewPassword = "new-password"
        };

        // Act
        var act = async () => await _controller.ChangePassword(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedException>()
            .WithMessage("Unable to change password: user account is not properly configured. Please contact support.");
    }

    [Fact]
    public async Task ChangePassword_ShouldGenerateJwtWithUpdatedMustChangePasswordClaim()
    {
        // Arrange
        SetupAuthenticatedUser(_userId);
        _passwordServiceMock.Setup(p => p.VerifyPassword("old-password", It.IsAny<string>()))
            .Returns(true);
        _passwordServiceMock.Setup(p => p.HashPassword("new-password"))
            .Returns("new-hashed-password");

        var user = await _context.Users.FindAsync(_userId);
        user!.MustChangePassword = true;
        await _context.SaveChangesAsync();

        User? capturedUser = null;
        _jwtServiceMock.Setup(j => j.GenerateAccessToken(It.IsAny<User>(), It.IsAny<OrganizationMember>()))
            .Callback<User, OrganizationMember>((u, m) => capturedUser = u)
            .Returns("test-access-token");

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "old-password",
            NewPassword = "new-password"
        };

        // Act
        await _controller.ChangePassword(request, CancellationToken.None);

        // Assert
        capturedUser.Should().NotBeNull();
        capturedUser!.MustChangePassword.Should().BeFalse();
        _jwtServiceMock.Verify(
            j => j.GenerateAccessToken(
                It.Is<User>(u => u.MustChangePassword == false),
                It.IsAny<OrganizationMember>()),
            Times.Once);
    }

    [Fact]
    public async Task ChangePassword_ShouldUseSerializableTransactionIsolation()
    {
        // Arrange
        SetupAuthenticatedUser(_userId);
        _passwordServiceMock.Setup(p => p.VerifyPassword("old-password", It.IsAny<string>()))
            .Returns(true);
        _passwordServiceMock.Setup(p => p.HashPassword("new-password"))
            .Returns("new-hashed-password");

        // Create existing refresh token
        var oldToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            TokenHash = "old-hash",
            ExpiresAt = _timeProvider.GetUtcNow().UtcDateTime.AddDays(7),
            DeviceInfo = "Test",
            IpAddress = IPAddress.Loopback
        };
        _context.RefreshTokens.Add(oldToken);
        await _context.SaveChangesAsync();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "old-password",
            NewPassword = "new-password"
        };

        // Act
        await _controller.ChangePassword(request, CancellationToken.None);

        // Assert - Verify both password update and token revocation completed
        var updatedUser = await _context.Users.FindAsync(_userId);
        updatedUser!.PasswordHash.Should().Be("new-hashed-password");
        updatedUser.MustChangePassword.Should().BeFalse();

        var tokens = await _context.RefreshTokens
            .Where(t => t.UserId == _userId)
            .ToListAsync();

        var revokedToken = tokens.First(t => t.TokenHash == "old-hash");
        revokedToken.RevokedAt.Should().NotBeNull();
        revokedToken.RevokedReason.Should().Be(RevokedReasons.PasswordChange);
    }

    #endregion

    #region Helper Methods

    private void SetupAuthenticatedUser(Guid userId)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim("org_id", _organizationId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext.HttpContext.User = principal;
    }

    private static string ComputeTokenHash(string token)
    {
        var bytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }

    #endregion
}
