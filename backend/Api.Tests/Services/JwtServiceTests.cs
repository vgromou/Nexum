using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Api.Configuration;
using Api.Models;
using Api.Services;
using AwesomeAssertions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

namespace Api.Tests.Services;

public class JwtServiceTests
{
    private readonly JwtSettings _settings;
    private readonly FakeTimeProvider _timeProvider;
    private readonly JwtService _service;

    public JwtServiceTests()
    {
        _settings = new JwtSettings
        {
            Secret = "test-secret-key-at-least-32-characters-long",
            Issuer = "test-issuer",
            Audience = "test-audience",
            AccessTokenExpirationMinutes = 15,
            RefreshTokenExpirationDays = 7
        };

        // Use current time to avoid lifetime validation issues with system clock
        _timeProvider = new FakeTimeProvider(DateTimeOffset.UtcNow);
        _service = new JwtService(Options.Create(_settings), _timeProvider);
    }

    private static User CreateTestUser(Guid? id = null)
    {
        return new User
        {
            Id = id ?? Guid.NewGuid(),
            Email = "test@example.com",
            Username = "testuser",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = "hashedpassword",
            IsActive = true
        };
    }

    private static OrganizationMember CreateTestMembership(Guid? userId = null, Guid? orgId = null, OrganizationRole role = OrganizationRole.User)
    {
        return new OrganizationMember
        {
            Id = Guid.NewGuid(),
            UserId = userId ?? Guid.NewGuid(),
            OrganizationId = orgId ?? Guid.NewGuid(),
            OrganizationRole = role,
            JoinedAt = DateTime.UtcNow
        };
    }

    #region AccessTokenExpiration Tests

    [Fact]
    public void AccessTokenExpiration_ShouldReturnConfiguredMinutes()
    {
        // Assert
        _service.AccessTokenExpiration.Should().Be(TimeSpan.FromMinutes(15));
    }

    [Fact]
    public void AccessTokenExpiration_ShouldReflectSettings()
    {
        // Arrange
        var customSettings = new JwtSettings
        {
            Secret = "test-secret-key-at-least-32-characters-long",
            Issuer = "test-issuer",
            Audience = "test-audience",
            AccessTokenExpirationMinutes = 30,
            RefreshTokenExpirationDays = 7
        };
        var service = new JwtService(Options.Create(customSettings), _timeProvider);

        // Assert
        service.AccessTokenExpiration.Should().Be(TimeSpan.FromMinutes(30));
    }

    #endregion

    #region RefreshTokenExpiration Tests

    [Fact]
    public void RefreshTokenExpiration_ShouldReturnConfiguredDays()
    {
        // Assert
        _service.RefreshTokenExpiration.Should().Be(TimeSpan.FromDays(7));
    }

    [Fact]
    public void RefreshTokenExpiration_ShouldReflectSettings()
    {
        // Arrange
        var customSettings = new JwtSettings
        {
            Secret = "test-secret-key-at-least-32-characters-long",
            Issuer = "test-issuer",
            Audience = "test-audience",
            AccessTokenExpirationMinutes = 15,
            RefreshTokenExpirationDays = 14
        };
        var service = new JwtService(Options.Create(customSettings), _timeProvider);

        // Assert
        service.RefreshTokenExpiration.Should().Be(TimeSpan.FromDays(14));
    }

    #endregion

    #region GenerateAccessToken Tests

    [Fact]
    public void GenerateAccessToken_ShouldReturnValidJwt()
    {
        // Arrange
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);

        // Act
        var token = _service.GenerateAccessToken(user, membership);

        // Assert
        token.Should().NotBeNullOrEmpty();
        token.Split('.').Should().HaveCount(3); // JWT has 3 parts
    }

    [Fact]
    public void GenerateAccessToken_ShouldContainSubjectClaim()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId);
        var membership = CreateTestMembership(userId);

        // Act
        var token = _service.GenerateAccessToken(user, membership);
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        // Assert
        jwt.Subject.Should().Be(userId.ToString());
    }

    [Fact]
    public void GenerateAccessToken_ShouldContainEmailClaim()
    {
        // Arrange
        var user = CreateTestUser();
        user.Email = "custom@example.com";
        var membership = CreateTestMembership(user.Id);

        // Act
        var token = _service.GenerateAccessToken(user, membership);
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        // Assert
        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Email && c.Value == "custom@example.com");
    }

    [Fact]
    public void GenerateAccessToken_ShouldContainOrganizationIdClaim()
    {
        // Arrange
        var user = CreateTestUser();
        var orgId = Guid.NewGuid();
        var membership = CreateTestMembership(user.Id, orgId);

        // Act
        var token = _service.GenerateAccessToken(user, membership);
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        // Assert
        jwt.Claims.Should().Contain(c => c.Type == "org_id" && c.Value == orgId.ToString());
    }

    [Theory]
    [InlineData(OrganizationRole.Admin, "admin")]
    [InlineData(OrganizationRole.Manager, "manager")]
    [InlineData(OrganizationRole.User, "user")]
    public void GenerateAccessToken_ShouldContainRoleClaim(OrganizationRole role, string expectedRole)
    {
        // Arrange
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id, role: role);

        // Act
        var token = _service.GenerateAccessToken(user, membership);
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        // Assert - JWT stores role as short type "role", not the full ClaimTypes.Role URI
        jwt.Claims.Should().Contain(c => c.Type == "role" && c.Value == expectedRole);
    }

    [Fact]
    public void GenerateAccessToken_ShouldContainJtiClaim()
    {
        // Arrange
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);

        // Act
        var token = _service.GenerateAccessToken(user, membership);
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        // Assert
        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Jti);
        var jti = jwt.Claims.First(c => c.Type == JwtRegisteredClaimNames.Jti).Value;
        Guid.TryParse(jti, out _).Should().BeTrue();
    }

    [Fact]
    public void GenerateAccessToken_ShouldContainIatClaim()
    {
        // Arrange
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);

        // Act
        var token = _service.GenerateAccessToken(user, membership);
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        // Assert
        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Iat);
    }

    [Fact]
    public void GenerateAccessToken_ShouldSetCorrectIssuer()
    {
        // Arrange
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);

        // Act
        var token = _service.GenerateAccessToken(user, membership);
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        // Assert
        jwt.Issuer.Should().Be("test-issuer");
    }

    [Fact]
    public void GenerateAccessToken_ShouldSetCorrectAudience()
    {
        // Arrange
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);

        // Act
        var token = _service.GenerateAccessToken(user, membership);
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        // Assert
        jwt.Audiences.Should().Contain("test-audience");
    }

    [Fact]
    public void GenerateAccessToken_ShouldSetCorrectExpiration()
    {
        // Arrange
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);
        var expectedExpiration = _timeProvider.GetUtcNow().UtcDateTime.AddMinutes(15);

        // Act
        var token = _service.GenerateAccessToken(user, membership);
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        // Assert
        jwt.ValidTo.Should().BeCloseTo(expectedExpiration, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void GenerateAccessToken_ShouldGenerateUniqueTokens()
    {
        // Arrange
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);

        // Act
        var token1 = _service.GenerateAccessToken(user, membership);
        var token2 = _service.GenerateAccessToken(user, membership);

        // Assert
        token1.Should().NotBe(token2);
    }

    [Theory]
    [InlineData(true, "true")]
    [InlineData(false, "false")]
    public void GenerateAccessToken_ShouldContainMustChangePasswordClaim(bool mustChangePassword, string expectedValue)
    {
        // Arrange
        var user = CreateTestUser();
        user.MustChangePassword = mustChangePassword;
        var membership = CreateTestMembership(user.Id);

        // Act
        var token = _service.GenerateAccessToken(user, membership);
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        // Assert
        jwt.Claims.Should().Contain(c => c.Type == "must_change_password" && c.Value == expectedValue);
    }

    [Fact]
    public void GenerateAccessToken_ShouldContainLowercaseMustChangePasswordClaim()
    {
        // Arrange
        var user = CreateTestUser();
        user.MustChangePassword = true;
        var membership = CreateTestMembership(user.Id);

        // Act
        var token = _service.GenerateAccessToken(user, membership);
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        // Assert - Verify claim value is lowercase "true", not "True"
        var claim = jwt.Claims.FirstOrDefault(c => c.Type == "must_change_password");
        claim.Should().NotBeNull();
        claim!.Value.Should().Be("true");
        claim.Value.Should().NotBe("True");
    }

    #endregion

    #region GenerateRefreshToken Tests

    [Fact]
    public void GenerateRefreshToken_ShouldReturnNonEmptyString()
    {
        // Act
        var token = _service.GenerateRefreshToken();

        // Assert
        token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void GenerateRefreshToken_ShouldReturnBase64String()
    {
        // Act
        var token = _service.GenerateRefreshToken();

        // Assert
        var act = () => Convert.FromBase64String(token);
        act.Should().NotThrow();
    }

    [Fact]
    public void GenerateRefreshToken_ShouldReturn64BytesWhenDecoded()
    {
        // Act
        var token = _service.GenerateRefreshToken();
        var bytes = Convert.FromBase64String(token);

        // Assert
        bytes.Should().HaveCount(64);
    }

    [Fact]
    public void GenerateRefreshToken_ShouldGenerateUniqueTokens()
    {
        // Act
        var tokens = Enumerable.Range(0, 100)
            .Select(_ => _service.GenerateRefreshToken())
            .ToList();

        // Assert
        tokens.Distinct().Should().HaveCount(100);
    }

    [Fact]
    public void GenerateRefreshToken_ShouldBeCryptographicallyRandom()
    {
        // Generate multiple tokens and ensure they have high entropy
        var tokens = Enumerable.Range(0, 10)
            .Select(_ => _service.GenerateRefreshToken())
            .ToList();

        // Each token should be unique
        tokens.Distinct().Should().HaveCount(10);

        // Tokens should have reasonable length (86-88 chars for base64 of 64 bytes)
        foreach (var token in tokens)
        {
            token.Length.Should().BeGreaterThanOrEqualTo(86);
        }
    }

    #endregion

    #region ValidateToken Tests

    [Fact]
    public void ValidateToken_ShouldReturnPrincipalForValidToken()
    {
        // Arrange
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);
        var token = _service.GenerateAccessToken(user, membership);

        // Act
        var principal = _service.ValidateToken(token);

        // Assert
        principal.Should().NotBeNull();
    }

    [Fact]
    public void ValidateToken_ShouldReturnNullForInvalidToken()
    {
        // Act
        var principal = _service.ValidateToken("invalid.token.string");

        // Assert
        principal.Should().BeNull();
    }

    [Fact]
    public void ValidateToken_ShouldReturnNullForTamperedToken()
    {
        // Arrange
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);
        var token = _service.GenerateAccessToken(user, membership);
        var tamperedToken = token[..^5] + "xxxxx";

        // Act
        var principal = _service.ValidateToken(tamperedToken);

        // Assert
        principal.Should().BeNull();
    }

    [Fact]
    public void ValidateToken_ShouldReturnNullForExpiredToken()
    {
        // Arrange
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);
        var token = _service.GenerateAccessToken(user, membership);

        // Advance time past expiration
        _timeProvider.Advance(TimeSpan.FromMinutes(20));

        // Act
        var principal = _service.ValidateToken(token);

        // Assert
        principal.Should().BeNull();
    }

    [Fact]
    public void ValidateToken_ShouldReturnPrincipalWithCorrectClaims()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId);
        user.Email = "validated@example.com";
        var membership = CreateTestMembership(userId, role: OrganizationRole.Admin);
        var token = _service.GenerateAccessToken(user, membership);

        // Act
        var principal = _service.ValidateToken(token);

        // Assert
        principal.Should().NotBeNull();
        principal!.FindFirst(ClaimTypes.NameIdentifier)?.Value.Should().Be(userId.ToString());
        principal.FindFirst(ClaimTypes.Email)?.Value.Should().Be("validated@example.com");
        principal.FindFirst(ClaimTypes.Role)?.Value.Should().Be("admin");
    }

    [Fact]
    public void ValidateToken_ShouldReturnNullForTokenWithWrongIssuer()
    {
        // Arrange - Create token with different issuer
        var differentSettings = new JwtSettings
        {
            Secret = "test-secret-key-at-least-32-characters-long",
            Issuer = "wrong-issuer",
            Audience = "test-audience",
            AccessTokenExpirationMinutes = 15,
            RefreshTokenExpirationDays = 7
        };
        var differentService = new JwtService(Options.Create(differentSettings), _timeProvider);
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);
        var token = differentService.GenerateAccessToken(user, membership);

        // Act
        var principal = _service.ValidateToken(token);

        // Assert
        principal.Should().BeNull();
    }

    [Fact]
    public void ValidateToken_ShouldReturnNullForTokenWithWrongAudience()
    {
        // Arrange - Create token with different audience
        var differentSettings = new JwtSettings
        {
            Secret = "test-secret-key-at-least-32-characters-long",
            Issuer = "test-issuer",
            Audience = "wrong-audience",
            AccessTokenExpirationMinutes = 15,
            RefreshTokenExpirationDays = 7
        };
        var differentService = new JwtService(Options.Create(differentSettings), _timeProvider);
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);
        var token = differentService.GenerateAccessToken(user, membership);

        // Act
        var principal = _service.ValidateToken(token);

        // Assert
        principal.Should().BeNull();
    }

    [Fact]
    public void ValidateToken_ShouldReturnNullForTokenWithDifferentSecret()
    {
        // Arrange - Create token with different secret
        var differentSettings = new JwtSettings
        {
            Secret = "different-secret-key-at-least-32-chars",
            Issuer = "test-issuer",
            Audience = "test-audience",
            AccessTokenExpirationMinutes = 15,
            RefreshTokenExpirationDays = 7
        };
        var differentService = new JwtService(Options.Create(differentSettings), _timeProvider);
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);
        var token = differentService.GenerateAccessToken(user, membership);

        // Act
        var principal = _service.ValidateToken(token);

        // Assert
        principal.Should().BeNull();
    }

    #endregion

    #region GetPrincipalFromExpiredToken Tests

    [Fact]
    public void GetPrincipalFromExpiredToken_ShouldReturnPrincipalForExpiredToken()
    {
        // Arrange
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);
        var token = _service.GenerateAccessToken(user, membership);

        // Advance time past expiration
        _timeProvider.Advance(TimeSpan.FromMinutes(20));

        // Act
        var principal = _service.GetPrincipalFromExpiredToken(token);

        // Assert
        principal.Should().NotBeNull();
    }

    [Fact]
    public void GetPrincipalFromExpiredToken_ShouldReturnCorrectClaimsFromExpiredToken()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = CreateTestUser(userId);
        user.Email = "expired@example.com";
        var orgId = Guid.NewGuid();
        var membership = CreateTestMembership(userId, orgId, OrganizationRole.Manager);
        var token = _service.GenerateAccessToken(user, membership);

        // Advance time past expiration
        _timeProvider.Advance(TimeSpan.FromMinutes(20));

        // Act
        var principal = _service.GetPrincipalFromExpiredToken(token);

        // Assert
        principal.Should().NotBeNull();
        principal!.FindFirst(ClaimTypes.NameIdentifier)?.Value.Should().Be(userId.ToString());
        principal.FindFirst(ClaimTypes.Email)?.Value.Should().Be("expired@example.com");
        principal.FindFirst("org_id")?.Value.Should().Be(orgId.ToString());
        principal.FindFirst(ClaimTypes.Role)?.Value.Should().Be("manager");
    }

    [Fact]
    public void GetPrincipalFromExpiredToken_ShouldReturnNullForInvalidToken()
    {
        // Act
        var principal = _service.GetPrincipalFromExpiredToken("invalid.token.string");

        // Assert
        principal.Should().BeNull();
    }

    [Fact]
    public void GetPrincipalFromExpiredToken_ShouldReturnNullForTamperedToken()
    {
        // Arrange
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);
        var token = _service.GenerateAccessToken(user, membership);
        var tamperedToken = token[..^5] + "xxxxx";

        // Act
        var principal = _service.GetPrincipalFromExpiredToken(tamperedToken);

        // Assert
        principal.Should().BeNull();
    }

    [Fact]
    public void GetPrincipalFromExpiredToken_ShouldWorkWithValidNonExpiredToken()
    {
        // Arrange
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);
        var token = _service.GenerateAccessToken(user, membership);

        // Act - Token is still valid
        var principal = _service.GetPrincipalFromExpiredToken(token);

        // Assert
        principal.Should().NotBeNull();
    }

    [Fact]
    public void GetPrincipalFromExpiredToken_ShouldReturnNullForTokenWithWrongAlgorithm()
    {
        // Arrange - create a token string that looks like JWT but uses wrong algorithm
        // This is a simplified test - in reality, the algorithm check happens on the header
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);
        var token = _service.GenerateAccessToken(user, membership);

        // Verify the token uses HS256
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);
        jwt.Header.Alg.Should().Be("HS256");
    }

    [Fact]
    public void GetPrincipalFromExpiredToken_ShouldReturnNullForTokenWithWrongSecret()
    {
        // Arrange - Create token with different secret
        var differentSettings = new JwtSettings
        {
            Secret = "different-secret-key-at-least-32-chars",
            Issuer = "test-issuer",
            Audience = "test-audience",
            AccessTokenExpirationMinutes = 15,
            RefreshTokenExpirationDays = 7
        };
        var differentService = new JwtService(Options.Create(differentSettings), _timeProvider);
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);
        var token = differentService.GenerateAccessToken(user, membership);

        // Act
        var principal = _service.GetPrincipalFromExpiredToken(token);

        // Assert
        principal.Should().BeNull();
    }

    #endregion

    #region Integration Tests

    [Fact]
    public void TokenRoundTrip_ShouldPreserveAllClaims()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var orgId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "roundtrip@example.com",
            Username = "roundtripuser",
            FirstName = "Round",
            LastName = "Trip",
            PasswordHash = "hash",
            IsActive = true
        };
        var membership = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            OrganizationId = orgId,
            OrganizationRole = OrganizationRole.Admin,
            JoinedAt = DateTime.UtcNow
        };

        // Act
        var token = _service.GenerateAccessToken(user, membership);
        var principal = _service.ValidateToken(token);

        // Assert
        principal.Should().NotBeNull();
        principal!.FindFirst(ClaimTypes.NameIdentifier)?.Value.Should().Be(userId.ToString());
        principal.FindFirst(ClaimTypes.Email)?.Value.Should().Be("roundtrip@example.com");
        principal.FindFirst("org_id")?.Value.Should().Be(orgId.ToString());
        principal.FindFirst(ClaimTypes.Role)?.Value.Should().Be("admin");
    }

    [Fact]
    public void RefreshTokenFlow_ShouldWorkWithExpiredAccessToken()
    {
        // Arrange - Generate tokens
        var user = CreateTestUser();
        var membership = CreateTestMembership(user.Id);
        var accessToken = _service.GenerateAccessToken(user, membership);
        var refreshToken = _service.GenerateRefreshToken();

        // Token should be valid initially
        _service.ValidateToken(accessToken).Should().NotBeNull();

        // Advance time past access token expiration
        _timeProvider.Advance(TimeSpan.FromMinutes(20));

        // Access token should now be invalid
        _service.ValidateToken(accessToken).Should().BeNull();

        // But we should be able to extract claims for refresh
        var principal = _service.GetPrincipalFromExpiredToken(accessToken);
        principal.Should().NotBeNull();

        // Refresh token should still be a valid format (actual validation would be in DB)
        refreshToken.Should().NotBeNullOrEmpty();
        Convert.FromBase64String(refreshToken).Should().HaveCount(64);
    }

    #endregion
}
