using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Common.Errors;
using Api.Data;
using Api.DTOs.Auth;
using Api.Exceptions;
using Api.Extensions;

namespace Api.Controllers.Users;

/// <summary>
/// Endpoints for user operations.
/// </summary>
[ApiController]
[Route("api")]
[Produces("application/json")]
[Tags("Users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UsersController(ApplicationDbContext context)
    {
        _context = context;
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
    [ProducesResponseType(typeof(LoginUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LoginUserResponse>> GetCurrentUser(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        if (userId == null)
        {
            throw new UnauthorizedException(
                "Invalid token: user ID not found in claims.",
                "UNAUTHORIZED");
        }

        var user = await _context.Users
            .Include(u => u.OrganizationMemberships)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException(
                "User not found.",
                "USER_NOT_FOUND");
        }

        var membership = user.OrganizationMemberships.FirstOrDefault();

        var response = new LoginUserResponse
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            FirstName = user.FirstName,
            LastName = user.LastName,
            OrganizationRole = membership?.OrganizationRole ?? Models.OrganizationRole.User,
            Position = user.Position,
            DateOfBirth = user.DateOfBirth,
            AvatarUrl = user.AvatarUrl,
            IsActive = user.IsActive,
            MustChangePassword = user.MustChangePassword,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            LastLoginAt = user.LastLoginAt
        };

        return Ok(response);
    }
}
