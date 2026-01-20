using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Common.Errors;
using Api.Data;
using Api.DTOs.Organizations;
using Api.DTOs.Users;
using Api.Exceptions;
using Api.Extensions;
using Api.Filters;
using Api.Models;
using Api.Services;

namespace Api.Controllers.Users;

/// <summary>
/// Endpoints for user operations.
/// </summary>
[ApiController]
[Route("api")]
[Produces("application/json")]
[Tags("Users")]
[Authorize]
[RequireValidClaims]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly TimeProvider _timeProvider;
    private readonly IAvatarUrlValidator _avatarUrlValidator;

    public UsersController(
        ApplicationDbContext context,
        TimeProvider timeProvider,
        IAvatarUrlValidator avatarUrlValidator)
    {
        _context = context;
        _timeProvider = timeProvider;
        _avatarUrlValidator = avatarUrlValidator;
    }

    /// <summary>
    /// Get current authenticated user's profile.
    /// </summary>
    /// <remarks>
    /// Returns the profile information of the currently authenticated user.
    /// The user ID is extracted from the JWT token claims.
    ///
    /// This is a convenience endpoint that doesn't require the client to know their own user ID.
    /// </remarks>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Current user's profile.</returns>
    /// <response code="200">User profile retrieved successfully.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">User not found in database.</response>
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserInfo>> GetCurrentUser(CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetValidatedUserId();
        var organizationId = HttpContext.GetValidatedOrganizationId();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException(
                "User not found.",
                "USER_NOT_FOUND");
        }

        var membership = await _context.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.UserId == userId, cancellationToken);

        return Ok(user.ToUserInfo(membership));
    }

    /// <summary>
    /// Update current authenticated user's profile.
    /// </summary>
    /// <remarks>
    /// Updates the profile of the currently authenticated user.
    /// Only provided fields are updated (PATCH semantics).
    ///
    /// **Note:** Users cannot change their own `organizationRole`. This field is silently ignored if provided.
    ///
    /// **Uniqueness constraints:**
    /// - `email` must be unique across all users (case-insensitive)
    /// - `username` must be unique across all users (case-insensitive)
    /// </remarks>
    /// <param name="request">Fields to update.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Updated user profile.</returns>
    /// <response code="200">User profile updated successfully.</response>
    /// <response code="400">Invalid input data.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">User not found in database.</response>
    /// <response code="409">Email or username already taken.</response>
    [HttpPatch("me")]
    [ProducesResponseType(typeof(UserInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserInfo>> UpdateCurrentUser(
        [FromBody] UpdateUserRequest request,
        CancellationToken cancellationToken)
    {
        // Users cannot change their own organizationRole - reject if provided
        if (request.OrganizationRole.HasValue)
        {
            throw new BadRequestException(
                "Users cannot change their own organization role. Contact an administrator.",
                "ORGANIZATION_ROLE_NOT_ALLOWED");
        }

        var userId = HttpContext.GetValidatedUserId();
        var organizationId = HttpContext.GetValidatedOrganizationId();

        // Use transaction to prevent race conditions with uniqueness checks
        await using var transaction = await _context.Database
            .BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException(
                "User not found.",
                "USER_NOT_FOUND");
        }

        // Check email uniqueness (exclude current user)
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

        // Check username uniqueness (exclude current user)
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

        // Get membership for response
        var membership = await _context.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.UserId == userId, cancellationToken);

        return Ok(user.ToUserInfo(membership));
    }
}
