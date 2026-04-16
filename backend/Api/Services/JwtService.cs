using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Api.Configuration;
using Api.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Api.Services;

/// <summary>
/// Service for JWT token generation and validation.
/// </summary>
public interface IJwtService
{
    /// <summary>
    /// Generates an access token for the specified user and organization membership.
    /// </summary>
    /// <param name="user">The user to generate the token for.</param>
    /// <param name="membership">The user's organization membership.</param>
    /// <returns>JWT access token string.</returns>
    string GenerateAccessToken(User user, OrganizationMember membership);

    /// <summary>
    /// Generates a cryptographically secure refresh token.
    /// </summary>
    /// <returns>Random refresh token string.</returns>
    string GenerateRefreshToken();

    /// <summary>
    /// Validates a JWT token and returns the claims principal.
    /// </summary>
    /// <param name="token">The JWT token to validate.</param>
    /// <returns>Claims principal if valid, null otherwise.</returns>
    ClaimsPrincipal? ValidateToken(string token);

    /// <summary>
    /// Gets the claims principal from an expired token (for refresh flow).
    /// </summary>
    /// <param name="token">The expired JWT token.</param>
    /// <returns>Claims principal without lifetime validation.</returns>
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);

    /// <summary>
    /// Gets the access token expiration time.
    /// </summary>
    TimeSpan AccessTokenExpiration { get; }

    /// <summary>
    /// Gets the refresh token expiration time.
    /// </summary>
    TimeSpan RefreshTokenExpiration { get; }
}

/// <summary>
/// Implementation of JWT service using Microsoft.IdentityModel.
/// </summary>
public sealed class JwtService : IJwtService
{
    private readonly JwtSettings _settings;
    private readonly TimeProvider _timeProvider;
    private readonly SymmetricSecurityKey _signingKey;
    private readonly JwtSecurityTokenHandler _tokenHandler;

    public JwtService(IOptions<JwtSettings> settings, TimeProvider timeProvider)
    {
        _settings = settings.Value;
        _timeProvider = timeProvider;
        _signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        _tokenHandler = new JwtSecurityTokenHandler();
    }

    /// <inheritdoc />
    public TimeSpan AccessTokenExpiration => TimeSpan.FromMinutes(_settings.AccessTokenExpirationMinutes);

    /// <inheritdoc />
    public TimeSpan RefreshTokenExpiration => TimeSpan.FromDays(_settings.RefreshTokenExpirationDays);

    /// <inheritdoc />
    public string GenerateAccessToken(User user, OrganizationMember membership)
    {
        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var expires = now.Add(AccessTokenExpiration);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat, new DateTimeOffset(now).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new("org_id", membership.OrganizationId.ToString()),
            new(ClaimTypes.Role, membership.OrganizationRole.ToString().ToLowerInvariant()),
            new("must_change_password", user.MustChangePassword.ToString().ToLowerInvariant())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            NotBefore = now,
            Expires = expires,
            Issuer = _settings.Issuer,
            Audience = _settings.Audience,
            SigningCredentials = new SigningCredentials(_signingKey, SecurityAlgorithms.HmacSha256Signature)
        };

        var token = _tokenHandler.CreateToken(tokenDescriptor);
        return _tokenHandler.WriteToken(token);
    }

    /// <inheritdoc />
    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    /// <inheritdoc />
    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var validationParameters = GetTokenValidationParameters(validateLifetime: true);
            var principal = _tokenHandler.ValidateToken(token, validationParameters, out _);
            return principal;
        }
        catch (Exception) when (IsTokenValidationException())
        {
            return null;
        }

        // Always returns true - used for exception filtering to catch all token validation errors
        static bool IsTokenValidationException() => true;
    }

    /// <inheritdoc />
    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        try
        {
            var validationParameters = GetTokenValidationParameters(validateLifetime: false);
            var principal = _tokenHandler.ValidateToken(token, validationParameters, out var securityToken);

            if (securityToken is not JwtSecurityToken jwtToken ||
                !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }
        catch (Exception) when (IsTokenValidationException())
        {
            return null;
        }

        // Always returns true - used for exception filtering to catch all token validation errors
        static bool IsTokenValidationException() => true;
    }

    private TokenValidationParameters GetTokenValidationParameters(bool validateLifetime)
    {
        var parameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = _signingKey,
            ValidateIssuer = true,
            ValidIssuer = _settings.Issuer,
            ValidateAudience = true,
            ValidAudience = _settings.Audience,
            ValidateLifetime = validateLifetime,
            ClockSkew = TimeSpan.Zero
        };

        // Use custom lifetime validator to respect the injected TimeProvider
        if (validateLifetime)
        {
            parameters.LifetimeValidator = (notBefore, expires, _, _) =>
            {
                var now = _timeProvider.GetUtcNow().UtcDateTime;
                if (notBefore.HasValue && now < notBefore.Value)
                    return false;
                if (expires.HasValue && now > expires.Value)
                    return false;
                return true;
            };
        }

        return parameters;
    }
}
