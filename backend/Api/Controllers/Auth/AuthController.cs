using System.Net;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Api.Common.Errors;
using Api.Configuration;
using Api.Data;
using Api.DTOs.Auth;
using Api.DTOs.Organizations;
using Api.Exceptions;
using Api.Models;
using Api.Services;

namespace Api.Controllers.Auth;

/// <summary>
/// Endpoints for user authentication.
/// </summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
[Tags("Authentication")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly IPasswordService _passwordService;
    private readonly TimeProvider _timeProvider;
    private readonly SecuritySettings _securitySettings;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        ApplicationDbContext context,
        IJwtService jwtService,
        IPasswordService passwordService,
        TimeProvider timeProvider,
        IOptions<SecuritySettings> securitySettings,
        ILogger<AuthController> logger)
    {
        _context = context;
        _jwtService = jwtService;
        _passwordService = passwordService;
        _timeProvider = timeProvider;
        _securitySettings = securitySettings.Value;
        _logger = logger;
    }

    /// <summary>
    /// Authenticate user with email/username and password.
    /// </summary>
    /// <remarks>
    /// Authenticates a user and returns JWT tokens for API access.
    ///
    /// **Login field:**
    /// - Accepts both email address and username
    /// - If contains `@`, treated as email; otherwise as username
    /// - Lookup is case-insensitive
    ///
    /// **Security:**
    /// - Account locks after configured failed attempts for configured duration
    /// - Generic error message for invalid credentials (doesn't reveal if user exists)
    /// - All login attempts are logged for audit
    ///
    /// **Response:**
    /// - Returns `mustChangePassword: true` if user needs to change password on first login
    /// </remarks>
    /// <param name="request">Login credentials.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Authentication tokens and user information.</returns>
    /// <response code="200">Login successful.</response>
    /// <response code="400">Invalid request body.</response>
    /// <response code="401">Invalid credentials, account locked, or account deactivated.</response>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var ipAddress = GetClientIpAddress();
        var userAgent = Request.Headers.UserAgent.ToString();

        // 1. Determine if login is email or username
        var isEmail = request.Login.Contains('@');
        var loginLower = request.Login.Trim().ToLowerInvariant();

        // 2. Find user (case-insensitive) with their organization membership
        // Note: Email and Username are stored in lowercase in the database
        var user = isEmail
            ? await _context.Users
                .Include(u => u.OrganizationMemberships)
                .FirstOrDefaultAsync(u => u.Email == loginLower, cancellationToken)
            : await _context.Users
                .Include(u => u.OrganizationMemberships)
                .FirstOrDefaultAsync(u => u.Username == loginLower, cancellationToken);

        // 3. Check if user exists (don't reveal which credential is wrong)
        if (user == null)
        {
            await LogAndSaveLoginAttempt(request.Login, ipAddress, userAgent, false, "User not found", cancellationToken);
            throw UnauthorizedException.InvalidCredentials();
        }

        // 4. Check if account is active
        if (!user.IsActive)
        {
            await LogAndSaveLoginAttempt(request.Login, ipAddress, userAgent, false, "Account deactivated", cancellationToken);
            throw UnauthorizedException.AccountDeactivated();
        }

        // 5. Check lockout
        if (user.LockoutUntil.HasValue && user.LockoutUntil > now)
        {
            var remainingMinutes = (int)Math.Ceiling((user.LockoutUntil.Value - now).TotalMinutes);
            await LogAndSaveLoginAttempt(request.Login, ipAddress, userAgent, false, "Account locked", cancellationToken);
            throw UnauthorizedException.AccountLocked(user.LockoutUntil.Value, remainingMinutes);
        }

        // 6. Verify password
        if (!_passwordService.VerifyPassword(request.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;

            // Lock account after configured failed attempts
            if (user.FailedLoginAttempts >= _securitySettings.MaxFailedLoginAttempts)
            {
                user.LockoutUntil = now.AddMinutes(_securitySettings.LockoutDurationMinutes);
            }

            AddLoginAttempt(request.Login, ipAddress, userAgent, false, "Invalid password");
            await _context.SaveChangesAsync(cancellationToken);
            throw UnauthorizedException.InvalidCredentials();
        }

        // 7. Get user's organization membership (MVP: single organization)
        var membership = user.OrganizationMemberships.FirstOrDefault();
        if (membership == null)
        {
            await LogAndSaveLoginAttempt(request.Login, ipAddress, userAgent, false, "No organization membership", cancellationToken);
            throw UnauthorizedException.InvalidCredentials();
        }

        // 8. Reset failed attempts and update timestamps
        user.FailedLoginAttempts = 0;
        user.LockoutUntil = null;
        user.LastLoginAt = now;

        // 9. Generate access token
        var accessToken = _jwtService.GenerateAccessToken(user, membership);

        // 10. Generate and store refresh token
        var refreshTokenValue = _jwtService.GenerateRefreshToken();
        var refreshTokenHash = HashToken(refreshTokenValue);

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            ExpiresAt = now.Add(_jwtService.RefreshTokenExpiration),
            DeviceInfo = userAgent,
            IpAddress = ipAddress
        };

        _context.RefreshTokens.Add(refreshToken);

        // 11. Log successful login and save all changes in single transaction
        AddLoginAttempt(request.Login, ipAddress, userAgent, true, null);
        await _context.SaveChangesAsync(cancellationToken);

        // 12. Build response
        var response = new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenValue,
            ExpiresIn = (int)_jwtService.AccessTokenExpiration.TotalSeconds,
            User = new UserInfo
            {
                Id = user.Id,
                MemberId = membership.Id,
                Email = user.Email,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                OrganizationRole = membership.OrganizationRole,
                Position = user.Position,
                DateOfBirth = user.DateOfBirth,
                AvatarUrl = user.AvatarUrl,
                IsActive = user.IsActive,
                MustChangePassword = user.MustChangePassword,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                LastLoginAt = user.LastLoginAt
            },
            MustChangePassword = user.MustChangePassword
        };

        return Ok(response);
    }

    /// <summary>
    /// Log out the current user by revoking their refresh token.
    /// </summary>
    /// <remarks>
    /// Revokes the provided refresh token so it can no longer be used to obtain new access tokens.
    ///
    /// **Behavior:**
    /// - Returns 200 OK even if the token is already revoked or not found (idempotent)
    /// - The access token remains valid until it expires (stateless JWT)
    /// - Client is responsible for clearing tokens from local storage
    /// </remarks>
    /// <param name="request">The refresh token to revoke.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Empty response on success.</returns>
    /// <response code="200">Logout successful (or token already revoked/not found).</response>
    /// <response code="400">Invalid request body.</response>
    /// <response code="401">User is not authenticated.</response>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout(
        [FromBody] LogoutRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // Hash the provided refresh token
        var tokenHash = HashToken(request.RefreshToken);

        // Find the token by hash
        var token = await _context.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        // If token exists and not already revoked, revoke it
        if (token != null && token.RevokedAt == null)
        {
            token.RevokedAt = _timeProvider.GetUtcNow().UtcDateTime;
            token.RevokedReason = "logout";
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("User {UserId} logged out, refresh token revoked", userId);
        }
        else if (token == null)
        {
            _logger.LogDebug("Logout attempted with unknown token by user {UserId}", userId);
        }
        else
        {
            _logger.LogDebug("Logout attempted with already revoked token by user {UserId}", userId);
        }

        // Always return success (idempotent)
        return Ok();
    }

    /// <summary>
    /// Hashes a token using SHA-256.
    /// </summary>
    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }

    /// <summary>
    /// Gets the client IP address from the request.
    /// </summary>
    /// <remarks>
    /// Note: X-Forwarded-For header can be spoofed by clients.
    /// In production, configure trusted proxies in ASP.NET Core's ForwardedHeaders middleware.
    /// </remarks>
    private IPAddress? GetClientIpAddress()
    {
        // Check for forwarded IP (behind proxy/load balancer)
        // WARNING: Only trust this header when behind a known proxy.
        // Configure ForwardedHeadersOptions.KnownProxies in production.
        var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            var ips = forwardedFor.Split(',', StringSplitOptions.RemoveEmptyEntries);
            if (ips.Length > 0 && IPAddress.TryParse(ips[0].Trim(), out var forwardedIp))
            {
                return forwardedIp;
            }
        }

        return HttpContext.Connection.RemoteIpAddress;
    }

    /// <summary>
    /// Adds a login attempt to the context without saving.
    /// Call SaveChangesAsync separately to persist.
    /// </summary>
    private void AddLoginAttempt(
        string login,
        IPAddress? ipAddress,
        string? userAgent,
        bool success,
        string? failureReason)
    {
        var attempt = new LoginAttempt
        {
            Id = Guid.NewGuid(),
            LoginIdentifier = login,
            IpAddress = ipAddress,
            Success = success,
            FailureReason = failureReason,
            UserAgent = userAgent
        };

        _context.LoginAttempts.Add(attempt);
    }

    /// <summary>
    /// Logs a login attempt and saves changes immediately.
    /// Use this for early-exit error paths where no other changes are pending.
    /// </summary>
    private async Task LogAndSaveLoginAttempt(
        string login,
        IPAddress? ipAddress,
        string? userAgent,
        bool success,
        string? failureReason,
        CancellationToken cancellationToken)
    {
        AddLoginAttempt(login, ipAddress, userAgent, success, failureReason);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
