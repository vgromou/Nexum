using System.Net;
using System.Security.Claims;
using Api.Configuration;
using Api.Controllers.Auth;
using Api.Data;
using Api.DTOs.Auth;
using Api.Exceptions;
using Api.Models;
using Api.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
}
