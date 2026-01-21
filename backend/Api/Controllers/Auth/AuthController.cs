using System.Data;
using System.Net;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Api.Common.Constants;
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
    /// <summary>
    /// Dummy password hash used for constant-time comparison when user doesn't exist.
    /// This prevents timing attacks that could reveal whether a user exists.
    /// Pre-computed BCrypt hash of a random string with work factor 12.
    /// </summary>
    private const string DummyPasswordHash = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.3/vBR8Z9.F.P.K";

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

        // 3. Verify password with constant-time comparison to prevent timing attacks
        // Always perform password verification, even if user doesn't exist, to ensure
        // consistent response time and prevent user enumeration via timing analysis
        var passwordHash = user?.PasswordHash ?? DummyPasswordHash;
        var isPasswordValid = _passwordService.VerifyPassword(request.Password, passwordHash);

        // 4. Check if user exists (don't reveal which credential is wrong)
        if (user == null)
        {
            await LogAndSaveLoginAttempt(request.Login, ipAddress, userAgent, false, "User not found", cancellationToken);
            throw UnauthorizedException.InvalidCredentials();
        }

        // 5. Check if account is active
        if (!user.IsActive)
        {
            await LogAndSaveLoginAttempt(request.Login, ipAddress, userAgent, false, "Account deactivated", cancellationToken);
            throw UnauthorizedException.AccountDeactivated();
        }

        // 6. Check lockout
        if (user.LockoutUntil.HasValue && user.LockoutUntil > now)
        {
            var remainingMinutes = (int)Math.Ceiling((user.LockoutUntil.Value - now).TotalMinutes);
            await LogAndSaveLoginAttempt(request.Login, ipAddress, userAgent, false, "Account locked", cancellationToken);
            throw UnauthorizedException.AccountLocked(user.LockoutUntil.Value, remainingMinutes);
        }

        // 7. Check password verification result
        if (!isPasswordValid)
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

        // 8. Get user's organization membership (MVP: single organization)
        var membership = user.OrganizationMemberships.FirstOrDefault();
        if (membership == null)
        {
            await LogAndSaveLoginAttempt(request.Login, ipAddress, userAgent, false, "No organization membership", cancellationToken);
            throw UnauthorizedException.InvalidCredentials();
        }

        // 9. Reset failed attempts and update timestamps
        user.FailedLoginAttempts = 0;
        user.LockoutUntil = null;
        user.LastLoginAt = now;

        // 10. Generate access token
        var accessToken = _jwtService.GenerateAccessToken(user, membership);

        // Use transaction to prevent race condition when multiple login requests arrive simultaneously
        await using var transaction = await _context.Database
            .BeginTransactionAsync(IsolationLevel.RepeatableRead, cancellationToken);

        // 11. Enforce max active sessions limit
        if (_securitySettings.MaxActiveSessionsPerUser > 0)
        {
            var activeTokens = await _context.RefreshTokens
                .Where(t => t.UserId == user.Id && t.RevokedAt == null && t.ExpiresAt > now)
                .OrderBy(t => t.CreatedAt)
                .ToListAsync(cancellationToken);

            // Revoke oldest sessions if at limit
            var tokensToRevoke = activeTokens.Count - _securitySettings.MaxActiveSessionsPerUser + 1;
            if (tokensToRevoke > 0)
            {
                foreach (var oldToken in activeTokens.Take(tokensToRevoke))
                {
                    oldToken.RevokedAt = now;
                    oldToken.RevokedReason = RevokedReasons.SessionLimitExceeded;
                }
                _logger.LogInformation(
                    "Revoked {Count} oldest session(s) for user {UserId} due to session limit",
                    tokensToRevoke, user.Id);
            }
        }

        // 12. Generate and store new refresh token
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

        // 13. Log successful login and save all changes in single transaction
        AddLoginAttempt(request.Login, ipAddress, userAgent, true, null);
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        // 14. Build response
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
        if (!Guid.TryParse(userId, out var userIdGuid))
        {
            _logger.LogWarning("Logout attempted with invalid user ID claim");
            return Ok(); // Idempotent - don't reveal internal state
        }

        // Hash the provided refresh token
        var tokenHash = HashToken(request.RefreshToken);

        // Find the token by hash
        var token = await _context.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        // Verify token belongs to the authenticated user (SECURITY: prevent users from revoking others' tokens)
        if (token != null && token.UserId != userIdGuid)
        {
            _logger.LogWarning(
                "SECURITY: User {UserId} attempted to revoke token belonging to user {TokenOwner}",
                userIdGuid, token.UserId);
            // Return OK to maintain idempotent behavior and not reveal token ownership
            return Ok();
        }

        // If token exists and not already revoked, revoke it
        if (token != null && token.RevokedAt == null)
        {
            token.RevokedAt = _timeProvider.GetUtcNow().UtcDateTime;
            token.RevokedReason = RevokedReasons.Logout;
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
    /// Refresh authentication tokens using a valid refresh token.
    /// </summary>
    /// <remarks>
    /// Exchanges a valid refresh token for new access and refresh tokens.
    ///
    /// **Token Rotation:**
    /// - The provided refresh token is revoked after successful refresh
    /// - A new refresh token is issued with each refresh (single-use tokens)
    /// - New refresh token gets a fresh 7-day expiration
    ///
    /// **Security:**
    /// - Reuse of an already-revoked token returns AUTH_TOKEN_REVOKED error
    /// - If user is deactivated, refresh is rejected even with valid token
    /// - All refresh attempts are logged for security audit
    ///
    /// **Note:** No Bearer token required - the refresh token itself serves as authentication.
    /// </remarks>
    /// <param name="request">The refresh token to exchange.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>New authentication tokens.</returns>
    /// <response code="200">Token refresh successful.</response>
    /// <response code="400">Invalid request body.</response>
    /// <response code="401">Token expired, revoked, or user deactivated.</response>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(RefreshResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<RefreshResponse>> Refresh(
        [FromBody] RefreshRequest request,
        CancellationToken cancellationToken)
    {
        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var ipAddress = GetClientIpAddress();
        var userAgent = Request.Headers.UserAgent.ToString();

        // Use Serializable isolation to prevent race condition when multiple refresh requests arrive simultaneously
        // RepeatableRead is insufficient as it doesn't prevent phantom reads - two concurrent refreshes
        // could both see the token as valid and create duplicate new tokens
        await using var transaction = await _context.Database
            .BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

        // 1. Hash the provided refresh token
        var tokenHash = HashToken(request.RefreshToken);

        // 2. Find the token by hash
        var token = await _context.RefreshTokens
            .Include(t => t.User)
                .ThenInclude(u => u.OrganizationMemberships)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        // 3. Validate token exists
        if (token == null)
        {
            _logger.LogWarning("Refresh attempted with unknown token from IP {IpAddress}", ipAddress);
            throw UnauthorizedException.TokenInvalid();
        }

        // 4. Check if token is already revoked (possible token reuse attack)
        if (token.RevokedAt != null)
        {
            // Token reuse detected - this is a potential attack!
            // Revoke ALL refresh tokens for this user (token family revocation)
            _logger.LogCritical(
                "SECURITY: Token reuse detected for user {UserId} from IP {IpAddress}. " +
                "Revoking all user tokens. Original revocation reason: {OriginalReason}",
                token.UserId, ipAddress, token.RevokedReason);

            var userTokens = await _context.RefreshTokens
                .Where(t => t.UserId == token.UserId && t.RevokedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var userToken in userTokens)
            {
                userToken.RevokedAt = now;
                userToken.RevokedReason = RevokedReasons.SecurityRevocation;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            throw UnauthorizedException.TokenRevoked();
        }

        // 5. Check if token has expired
        if (token.ExpiresAt < now)
        {
            _logger.LogInformation("Refresh attempted with expired token for user {UserId}", token.UserId);
            throw UnauthorizedException.RefreshTokenExpired();
        }

        // 5a. Validate IP address binding (detect potential token theft)
        var storedIp = token.IpAddress?.ToString();
        var currentIp = ipAddress?.ToString();
        if (!string.IsNullOrEmpty(storedIp) && storedIp != currentIp)
        {
            _logger.LogWarning(
                "SECURITY: Token refresh from different IP. User {UserId}, Original IP: {OriginalIp}, Current IP: {CurrentIp}, DeviceInfo: {DeviceInfo}",
                token.UserId, storedIp, currentIp, token.DeviceInfo);

            if (_securitySettings.EnforceTokenIpBinding)
            {
                // Revoke this token family as potential theft
                var userTokens = await _context.RefreshTokens
                    .Where(t => t.UserId == token.UserId && t.RevokedAt == null)
                    .ToListAsync(cancellationToken);

                foreach (var userToken in userTokens)
                {
                    userToken.RevokedAt = now;
                    userToken.RevokedReason = RevokedReasons.SecurityRevocation;
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                throw UnauthorizedException.TokenInvalid();
            }
        }

        // 6. Check if user is active
        var user = token.User;
        if (!user.IsActive)
        {
            _logger.LogWarning("Refresh attempted for deactivated user {UserId}", user.Id);
            throw UnauthorizedException.AccountDeactivated();
        }

        // 7. Get user's organization membership (MVP: single organization)
        var membership = user.OrganizationMemberships.FirstOrDefault();
        if (membership == null)
        {
            _logger.LogWarning("Refresh attempted for user {UserId} with no organization membership", user.Id);
            throw UnauthorizedException.TokenInvalid();
        }

        // 8. Revoke the old refresh token (single-use)
        token.RevokedAt = now;
        token.RevokedReason = RevokedReasons.Refresh;

        // 9. Generate new access token
        var accessToken = _jwtService.GenerateAccessToken(user, membership);

        // 10. Generate and store new refresh token (rotation)
        var newRefreshTokenValue = _jwtService.GenerateRefreshToken();
        var newRefreshTokenHash = HashToken(newRefreshTokenValue);

        var newRefreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = newRefreshTokenHash,
            ExpiresAt = now.Add(_jwtService.RefreshTokenExpiration),
            DeviceInfo = userAgent,
            IpAddress = ipAddress
        };

        _context.RefreshTokens.Add(newRefreshToken);
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        _logger.LogInformation("User {UserId} refreshed tokens from IP {IpAddress}", user.Id, ipAddress);

        // 11. Build response
        var response = new RefreshResponse
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshTokenValue,
            ExpiresIn = (int)_jwtService.AccessTokenExpiration.TotalSeconds
        };

        return Ok(response);
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
    /// The ForwardedHeaders middleware (configured in Program.cs) automatically processes
    /// X-Forwarded-For headers from trusted proxies and updates RemoteIpAddress accordingly.
    /// In production, configure KnownProxies or KnownNetworks in ForwardedHeadersOptions.
    /// </remarks>
    private IPAddress? GetClientIpAddress()
    {
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

    /// <summary>
    /// Change the current user's password.
    /// </summary>
    /// <remarks>
    /// Allows authenticated users to change their password. This endpoint is required
    /// when `mustChangePassword` is true after login with a temporary password.
    ///
    /// **Security:**
    /// - Requires valid current password
    /// - All active sessions are terminated after password change (refresh tokens revoked)
    /// - Clears the `mustChangePassword` flag
    ///
    /// **Response:**
    /// - Returns new access and refresh tokens with `must_change_password=false`
    /// - Client should replace stored tokens with the new ones
    /// </remarks>
    /// <param name="request">Current and new password.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>New authentication tokens.</returns>
    /// <response code="200">Password changed successfully.</response>
    /// <response code="400">Invalid request body or new password requirements not met.</response>
    /// <response code="401">User is not authenticated or current password is incorrect.</response>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(ChangePasswordResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ChangePasswordResponse>> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var ipAddress = GetClientIpAddress();
        var userAgent = Request.Headers.UserAgent.ToString();

        // Get user ID from claims
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedException("Invalid token", "UNAUTHORIZED");
        }

        // Find user with organization membership
        var user = await _context.Users
            .Include(u => u.OrganizationMemberships)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            throw new UnauthorizedException("User not found", "UNAUTHORIZED");
        }

        // Verify current password
        if (!_passwordService.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            _logger.LogWarning("Password change failed for user {UserId}: incorrect current password", userId);
            throw new UnauthorizedException("Current password is incorrect", "INVALID_PASSWORD");
        }

        // Get user's organization membership (MVP: single organization)
        var membership = user.OrganizationMemberships.FirstOrDefault();
        if (membership == null)
        {
            throw new UnauthorizedException("User has no organization membership", "UNAUTHORIZED");
        }

        // Use transaction to ensure password update and token revocation are atomic
        await using var transaction = await _context.Database
            .BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

        // Update password and clear must_change_password flag
        user.PasswordHash = _passwordService.HashPassword(request.NewPassword);
        user.MustChangePassword = false;
        user.PasswordChangedAt = now;

        // Revoke all user's existing refresh tokens
        var userTokens = await _context.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in userTokens)
        {
            token.RevokedAt = now;
            token.RevokedReason = RevokedReasons.PasswordChange;
        }

        // Generate new access token (with must_change_password=false)
        var accessToken = _jwtService.GenerateAccessToken(user, membership);

        // Generate and store new refresh token
        var refreshTokenValue = _jwtService.GenerateRefreshToken();
        var refreshTokenHash = HashToken(refreshTokenValue);

        var newRefreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            ExpiresAt = now.Add(_jwtService.RefreshTokenExpiration),
            DeviceInfo = userAgent,
            IpAddress = ipAddress
        };

        _context.RefreshTokens.Add(newRefreshToken);
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        _logger.LogInformation(
            "User {UserId} changed their password. {TokenCount} old refresh tokens revoked, new tokens issued.",
            userId, userTokens.Count);

        var response = new ChangePasswordResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenValue,
            ExpiresIn = (int)_jwtService.AccessTokenExpiration.TotalSeconds
        };

        return Ok(response);
    }
}
