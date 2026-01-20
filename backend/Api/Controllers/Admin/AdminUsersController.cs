using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Api.Common.Constants;
using Api.Common.Errors;
using Api.Configuration;
using Api.Data;
using Api.DTOs.Admin;
using Api.Exceptions;
using Api.Extensions;
using Api.Filters;
using Api.Services;

namespace Api.Controllers.Admin;

/// <summary>
/// Administrative endpoints for user management.
/// All endpoints require admin role.
/// </summary>
[ApiController]
[Route("api/admin/users")]
[Produces("application/json")]
[Tags("Admin Users")]
[Authorize(Roles = "admin")]
[RequireValidClaims]
public class AdminUsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordService _passwordService;
    private readonly TimeProvider _timeProvider;
    private readonly SecuritySettings _securitySettings;
    private readonly ILogger<AdminUsersController> _logger;

    public AdminUsersController(
        ApplicationDbContext context,
        IPasswordService passwordService,
        TimeProvider timeProvider,
        IOptions<SecuritySettings> securitySettings,
        ILogger<AdminUsersController> logger)
    {
        _context = context;
        _passwordService = passwordService;
        _timeProvider = timeProvider;
        _securitySettings = securitySettings.Value;
        _logger = logger;
    }

    /// <summary>
    /// Reset a user's password to a temporary one.
    /// </summary>
    /// <remarks>
    /// Resets the specified user's password to a randomly generated temporary password.
    ///
    /// **Security:**
    /// - Caller must be an admin in the same organization as the target user
    /// - All active sessions for the user are terminated (refresh tokens revoked)
    /// - User will be required to change password on next login
    ///
    /// **Response:**
    /// - Returns the temporary password (shown only once)
    /// - The temporary password should be securely shared with the user
    /// </remarks>
    /// <param name="userId">The ID of the user whose password should be reset.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Reset password response with temporary password.</returns>
    /// <response code="200">Password reset successfully.</response>
    /// <response code="401">User is not authenticated.</response>
    /// <response code="403">Caller is not an admin or user is not in the same organization.</response>
    /// <response code="404">User not found.</response>
    [HttpPost("{userId:guid}/reset-password")]
    [ProducesResponseType(typeof(ResetPasswordResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ResetPasswordResponse>> ResetPassword(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var now = _timeProvider.GetUtcNow().UtcDateTime;

        // 1. Get caller's organization from JWT (validated by RequireValidClaimsAttribute)
        var callerOrganizationId = HttpContext.GetValidatedOrganizationId();
        var callerUserId = HttpContext.GetValidatedUserId();

        // 2. Find target user and verify they belong to caller's organization
        var targetUser = await _context.Users
            .Include(u => u.OrganizationMemberships)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (targetUser == null)
        {
            throw NotFoundException.User(userId);
        }

        // Check if target user is in the same organization as caller
        var isInSameOrganization = targetUser.OrganizationMemberships
            .Any(m => m.OrganizationId == callerOrganizationId);

        if (!isInSameOrganization)
        {
            _logger.LogWarning(
                "Admin {AdminId} attempted to reset password for user {UserId} who is not in their organization {OrgId}",
                callerUserId, userId, callerOrganizationId);
            throw ForbiddenException.InsufficientPermissions("reset password for users outside your organization");
        }

        // 3. Generate temporary password
        var temporaryPassword = _passwordService.GenerateTemporaryPassword(_securitySettings.TemporaryPasswordLength);

        // Use transaction to ensure password update and token revocation are atomic
        await using var transaction = await _context.Database
            .BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

        // 4. Hash and update user's password
        targetUser.PasswordHash = _passwordService.HashPassword(temporaryPassword);
        targetUser.MustChangePassword = true;
        targetUser.PasswordChangedAt = now;

        // 5. Revoke all user's refresh tokens
        var userTokens = await _context.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in userTokens)
        {
            token.RevokedAt = now;
            token.RevokedReason = RevokedReasons.PasswordReset;
        }

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        _logger.LogInformation(
            "Admin {AdminId} reset password for user {UserId}. {TokenCount} refresh tokens revoked.",
            callerUserId, userId, userTokens.Count);

        // 6. Return response
        return Ok(new ResetPasswordResponse
        {
            UserId = userId,
            TemporaryPassword = temporaryPassword
        });
    }
}
