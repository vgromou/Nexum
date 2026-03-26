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
using Api.DTOs.Organizations;
using Api.DTOs.Users;
using Api.Exceptions;
using Api.Extensions;
using Api.Filters;
using Api.Models;
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
    private readonly IAvatarUrlValidator _avatarUrlValidator;
    private readonly ILogger<AdminUsersController> _logger;

    public AdminUsersController(
        ApplicationDbContext context,
        IPasswordService passwordService,
        TimeProvider timeProvider,
        IOptions<SecuritySettings> securitySettings,
        IAvatarUrlValidator avatarUrlValidator,
        ILogger<AdminUsersController> logger)
    {
        _context = context;
        _passwordService = passwordService;
        _timeProvider = timeProvider;
        _securitySettings = securitySettings.Value;
        _avatarUrlValidator = avatarUrlValidator;
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

    /// <summary>
    /// Update a user's profile by ID.
    /// </summary>
    /// <remarks>
    /// Updates the profile of a user by their ID. Only provided fields are updated (PATCH semantics).
    ///
    /// **Access Control:**
    /// - Requires admin role
    /// - Can only update users within the same organization
    ///
    /// **Business Rules:**
    /// - `email` must be unique across all users (case-insensitive)
    /// - `username` must be unique across all users (case-insensitive)
    /// - Cannot demote the last admin in the organization
    /// </remarks>
    /// <param name="userId">User ID to update.</param>
    /// <param name="request">Fields to update.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Updated user profile.</returns>
    /// <response code="200">User profile updated successfully.</response>
    /// <response code="400">Invalid input data.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">User is outside your organization or cannot demote last admin.</response>
    /// <response code="404">User not found.</response>
    /// <response code="409">Email or username already taken.</response>
    [HttpPatch("{userId:guid}")]
    [ProducesResponseType(typeof(UserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserInfo>> UpdateUser(
        Guid userId,
        [FromBody] UpdateUserRequest request,
        CancellationToken cancellationToken)
    {
        var callerOrganizationId = HttpContext.GetValidatedOrganizationId();

        // Use Serializable transaction to prevent race conditions:
        // - Uniqueness checks for email/username
        // - Last admin check when demoting roles
        await using var transaction = await _context.Database
            .BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

        // Find target user
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            throw NotFoundException.User(userId);
        }

        // Get target user's membership in caller's organization
        var targetMembership = await _context.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == callerOrganizationId && m.UserId == userId, cancellationToken);

        if (targetMembership == null)
        {
            throw ForbiddenException.InsufficientPermissions("update users outside your organization");
        }

        // Check email uniqueness (exclude target user)
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var emailLower = request.Email.Trim().ToLowerInvariant();
            var emailExists = await _context.Users
                .AnyAsync(u => u.Id != userId && u.Email == emailLower, cancellationToken);

            if (emailExists)
            {
                throw ConflictException.EmailExists(emailLower);
            }
        }

        // Check username uniqueness (exclude target user)
        if (!string.IsNullOrWhiteSpace(request.Username))
        {
            var usernameLower = request.Username.Trim().ToLowerInvariant();
            var usernameExists = await _context.Users
                .AnyAsync(u => u.Id != userId && u.Username == usernameLower, cancellationToken);

            if (usernameExists)
            {
                throw ConflictException.UsernameExists(usernameLower);
            }
        }

        // Handle organizationRole change
        if (request.OrganizationRole.HasValue)
        {
            var newRole = request.OrganizationRole.Value;
            var currentRole = targetMembership.OrganizationRole;

            // Check if demoting an admin
            if (currentRole == OrganizationRole.Admin && newRole != OrganizationRole.Admin)
            {
                // Count active admins in organization (transaction ensures atomicity)
                var adminCount = await _context.OrganizationMembers
                    .CountAsync(m => m.OrganizationId == callerOrganizationId && m.OrganizationRole == OrganizationRole.Admin, cancellationToken);

                if (adminCount <= 1)
                {
                    throw new BusinessRuleException(
                        "Cannot demote the last admin in the organization.",
                        "CANNOT_REMOVE_LAST_ADMIN");
                }
            }

            targetMembership.OrganizationRole = newRole;
        }

        // Apply updates (only non-null fields) - PATCH semantics
        if (!string.IsNullOrWhiteSpace(request.Email))
            user.Email = request.Email.Trim().ToLowerInvariant();

        if (!string.IsNullOrWhiteSpace(request.Username))
            user.Username = request.Username.Trim().ToLowerInvariant();

        if (request.FirstName != null)
            user.FirstName = request.FirstName.Trim();

        if (request.LastName != null)
            user.LastName = request.LastName.Trim();

        if (request.Position != null)
            user.Position = string.IsNullOrWhiteSpace(request.Position) ? null : request.Position.Trim();

        if (request.DateOfBirth.HasValue)
            user.DateOfBirth = request.DateOfBirth.Value;

        if (request.AvatarUrl != null)
        {
            var avatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim();
            _avatarUrlValidator.ValidateAvatarUrl(avatarUrl);
            user.AvatarUrl = avatarUrl;
        }

        // Update timestamp
        user.UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime;

        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Ok(user.ToUserInfo(targetMembership));
    }
}
