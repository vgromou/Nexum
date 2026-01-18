#if DEBUG
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Common.Errors;
using Api.Data;
using Api.DTOs.Auth;
using Api.Exceptions;
using Api.Models;

namespace Api.Controllers;

/// <summary>
/// Test endpoints for development and testing purposes.
/// </summary>
/// <remarks>
/// These endpoints are only available in DEBUG builds and should never be deployed to production.
/// </remarks>
[ApiController]
[Route("api/test")]
[Produces("application/json")]
[Tags("Testing")]
public class TestController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly TimeProvider _timeProvider;

    public TestController(ApplicationDbContext context, TimeProvider timeProvider)
    {
        _context = context;
        _timeProvider = timeProvider;
    }

    /// <summary>
    /// Create a test admin user.
    /// </summary>
    /// <remarks>
    /// **DEBUG ONLY** - This endpoint is only available in DEBUG builds.
    ///
    /// Creates a default admin user for testing purposes with:
    /// - **Username:** `admin`
    /// - **Email:** `admin@localhost`
    /// - **Password:** `admin`
    /// - **Role:** Admin
    ///
    /// The user is automatically added to the first available organization.
    /// </remarks>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created user information.</returns>
    /// <response code="201">Admin user created successfully.</response>
    /// <response code="404">No organization found.</response>
    /// <response code="409">Username 'admin' already exists.</response>
    [HttpPost("seed-admin")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginUserResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<LoginUserResponse>> SeedAdmin(CancellationToken cancellationToken)
    {
        // Check if admin user already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == "admin", cancellationToken);

        if (existingUser != null)
        {
            throw ConflictException.UsernameExists("admin");
        }

        // Get the first organization
        var organization = await _context.Organizations
            .FirstOrDefaultAsync(cancellationToken);

        if (organization == null)
        {
            throw new NotFoundException(
                "No organization found. Create an organization first.",
                "ORGANIZATION_NOT_FOUND");
        }

        var now = _timeProvider.GetUtcNow().UtcDateTime;

        // Create admin user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@localhost",
            Username = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin"),
            FirstName = "Admin",
            LastName = "User",
            IsActive = true,
            MustChangePassword = false,
            CreatedAt = now,
            UpdatedAt = now
        };

        // Create organization membership with admin role
        var membership = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            OrganizationId = organization.Id,
            OrganizationRole = OrganizationRole.Admin,
            JoinedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Users.Add(user);
        _context.OrganizationMembers.Add(membership);
        await _context.SaveChangesAsync(cancellationToken);

        var response = new LoginUserResponse
        {
            Id = user.Id,
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
        };

        return StatusCode(StatusCodes.Status201Created, response);
    }
}
#endif
