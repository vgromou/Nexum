using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Common.Errors;
using Api.Data;
using Api.DTOs.Common;
using Api.DTOs.Organizations;
using Api.Exceptions;
using Api.Extensions;
using Api.Models;
using Api.Services;

namespace Api.Controllers.Organizations;

/// <summary>
/// Endpoints for managing organization members.
/// </summary>
[ApiController]
[Route("api/organizations/{organizationId:guid}/members")]
[Produces("application/json")]
[Tags("Organization Members")]
[Authorize]
public class OrganizationMembersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordService _passwordService;
    private readonly TimeProvider _timeProvider;

    public OrganizationMembersController(
        ApplicationDbContext context,
        IPasswordService passwordService,
        TimeProvider timeProvider)
    {
        _context = context;
        _passwordService = passwordService;
        _timeProvider = timeProvider;
    }

    /// <summary>
    /// Get all members of an organization.
    /// </summary>
    /// <remarks>
    /// Retrieves a paginated list of all members in the organization.
    ///
    /// **Authorization:** Requires authentication. Accessible to all organization members.
    ///
    /// **Filtering:**
    /// - `search`: Case-insensitive partial match on email, first name, last name, or username.
    /// - `organizationRole`: Filter by role (Admin, Manager, User).
    /// - `isActive`: Filter by active status.
    ///
    /// **Sorting:**
    /// - `sortBy`: Sort field (email, firstName, lastName, createdAt). Default: createdAt.
    /// - `sortOrder`: Sort order (asc, desc). Default: desc.
    ///
    /// **Pagination:**
    /// - `page`: Page number (1-based). Default: 1.
    /// - `pageSize`: Items per page (1-100). Default: 20.
    /// </remarks>
    /// <param name="organizationId">The organization's unique identifier.</param>
    /// <param name="query">Query parameters for filtering, sorting, and pagination.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Paginated list of organization members.</returns>
    /// <response code="200">Members retrieved successfully.</response>
    /// <response code="400">Invalid query parameters.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Not authorized to view members of this organization.</response>
    /// <response code="404">Organization not found.</response>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<MemberResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PagedResponse<MemberResponse>>> GetMembers(
        [FromRoute] Guid organizationId,
        [FromQuery] GetMembersQueryParameters query,
        CancellationToken cancellationToken)
    {
        // Verify organization exists
        var organizationExists = await _context.Organizations
            .AnyAsync(o => o.Id == organizationId, cancellationToken);

        if (!organizationExists)
        {
            throw NotFoundException.Organization(organizationId);
        }

        // Verify caller belongs to this organization
        var tokenOrgId = User.GetOrganizationId();
        if (tokenOrgId != organizationId)
        {
            throw ForbiddenException.InsufficientPermissions("view members of this organization");
        }

        // Build base query
        var membersQuery = _context.OrganizationMembers
            .Where(m => m.OrganizationId == organizationId)
            .Include(m => m.User)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var searchLower = query.Search.ToLower();
            membersQuery = membersQuery.Where(m =>
                m.User.Email.ToLower().Contains(searchLower) ||
                m.User.FirstName.ToLower().Contains(searchLower) ||
                m.User.LastName.ToLower().Contains(searchLower) ||
                m.User.Username.ToLower().Contains(searchLower));
        }

        // Apply role filter
        if (query.OrganizationRole.HasValue)
        {
            membersQuery = membersQuery.Where(m => m.OrganizationRole == query.OrganizationRole.Value);
        }

        // Apply active status filter
        if (query.IsActive.HasValue)
        {
            membersQuery = membersQuery.Where(m => m.User.IsActive == query.IsActive.Value);
        }

        // Get total count before pagination
        var totalItems = await membersQuery.CountAsync(cancellationToken);

        // Apply sorting
        membersQuery = query.SortBy.ToLower() switch
        {
            "email" => query.SortOrder.ToLower() == "asc"
                ? membersQuery.OrderBy(m => m.User.Email)
                : membersQuery.OrderByDescending(m => m.User.Email),
            "firstname" => query.SortOrder.ToLower() == "asc"
                ? membersQuery.OrderBy(m => m.User.FirstName)
                : membersQuery.OrderByDescending(m => m.User.FirstName),
            "lastname" => query.SortOrder.ToLower() == "asc"
                ? membersQuery.OrderBy(m => m.User.LastName)
                : membersQuery.OrderByDescending(m => m.User.LastName),
            _ => query.SortOrder.ToLower() == "asc"
                ? membersQuery.OrderBy(m => m.User.CreatedAt)
                : membersQuery.OrderByDescending(m => m.User.CreatedAt)
        };

        // Apply pagination
        var skip = (query.Page - 1) * query.PageSize;
        var members = await membersQuery
            .Skip(skip)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        // Map to response items
        var items = members.Select(m => new MemberResponse
        {
            Id = m.User.Id,
            Email = m.User.Email,
            Username = m.User.Username,
            FirstName = m.User.FirstName,
            LastName = m.User.LastName,
            OrganizationRole = m.OrganizationRole,
            Position = m.User.Position,
            DateOfBirth = m.User.DateOfBirth,
            AvatarUrl = m.User.AvatarUrl,
            IsActive = m.User.IsActive,
            MustChangePassword = m.User.MustChangePassword,
            CreatedAt = m.User.CreatedAt,
            UpdatedAt = m.User.UpdatedAt,
            LastLoginAt = null // TODO: Add LastLoginAt to User model when login tracking is implemented
        });

        return Ok(PagedResponse.Create(items, query.Page, query.PageSize, totalItems));
    }

    /// <summary>
    /// Add a new member to the organization.
    /// </summary>
    /// <remarks>
    /// Creates a new user account and adds them as a member of the specified organization.
    /// A temporary password is generated that must be changed on first login.
    ///
    /// **Authorization:** Requires Admin role in the organization.
    ///
    /// **Auto-generation:**
    /// - If username is not provided, it will be generated from the email (part before @).
    /// - A 16-character temporary password is automatically generated using CSPRNG.
    ///
    /// **Important:** The temporary password is returned only once in the response.
    /// It should be securely shared with the new member.
    ///
    /// **Note:** Currently a user can only be a member of one organization (MVP constraint).
    /// </remarks>
    /// <param name="organizationId">The organization's unique identifier.</param>
    /// <param name="request">Member creation request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Created member with temporary password.</returns>
    /// <response code="201">Member added successfully.</response>
    /// <response code="400">Invalid input data.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Not authorized to add members to this organization.</response>
    /// <response code="404">Organization not found.</response>
    /// <response code="409">Email or username already exists.</response>
    [HttpPost]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(CreateUserResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CreateUserResponse>> AddMember(
        [FromRoute] Guid organizationId,
        [FromBody] CreateUserRequest request,
        CancellationToken cancellationToken)
    {
        // Verify organization exists
        var organizationExists = await _context.Organizations
            .AnyAsync(o => o.Id == organizationId, cancellationToken);

        if (!organizationExists)
        {
            throw NotFoundException.Organization(organizationId);
        }

        // Verify caller belongs to this organization
        var tokenOrgId = User.GetOrganizationId();
        if (tokenOrgId != organizationId)
        {
            throw ForbiddenException.InsufficientPermissions("add members to this organization");
        }

        // Normalize email to lowercase
        var email = request.Email.Trim().ToLowerInvariant();

        // Generate username from email if not provided
        var username = string.IsNullOrWhiteSpace(request.Username)
            ? GenerateUsernameFromEmail(email)
            : request.Username.Trim().ToLowerInvariant();

        // Check email uniqueness (globally unique)
        var emailExists = await _context.Users
            .AnyAsync(u => u.Email == email, cancellationToken);

        if (emailExists)
        {
            throw ConflictException.EmailExists(email);
        }

        // Check username uniqueness (globally unique)
        var usernameExists = await _context.Users
            .AnyAsync(u => u.Username == username, cancellationToken);

        if (usernameExists)
        {
            throw ConflictException.UsernameExists(username);
        }

        // Generate temporary password
        var temporaryPassword = _passwordService.GenerateTemporaryPassword(16);
        var passwordHash = _passwordService.HashPassword(temporaryPassword);

        var now = _timeProvider.GetUtcNow().UtcDateTime;

        // Create user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Username = username,
            PasswordHash = passwordHash,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Position = request.Position?.Trim(),
            DateOfBirth = request.DateOfBirth,
            IsActive = true,
            MustChangePassword = true,
            PasswordChangedAt = now
        };

        // Create organization membership
        var membership = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            UserId = user.Id,
            OrganizationRole = request.OrganizationRole,
            JoinedAt = now
        };

        _context.Users.Add(user);
        _context.OrganizationMembers.Add(membership);
        await _context.SaveChangesAsync(cancellationToken);

        var userDto = new UserInfo
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
            MustChangePassword = user.MustChangePassword
        };

        var response = new CreateUserResponse
        {
            User = userDto,
            TemporaryPassword = temporaryPassword
        };

        return StatusCode(StatusCodes.Status201Created, response);
    }

#if DEBUG
    /// <summary>
    /// Remove a member from the organization.
    /// </summary>
    /// <remarks>
    /// **DEBUG ONLY** - This endpoint is only available in DEBUG builds for testing purposes.
    ///
    /// Removes a user's membership from the organization. The user account itself is NOT deleted.
    /// Cannot remove the last admin from an organization.
    /// </remarks>
    /// <param name="organizationId">The organization's unique identifier.</param>
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>No content on success.</returns>
    /// <response code="204">Member removed successfully.</response>
    /// <response code="400">Invalid request.</response>
    /// <response code="404">Organization or member not found.</response>
    /// <response code="422">Cannot remove the last admin.</response>
    [HttpDelete("{userId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> RemoveMember(
        [FromRoute] Guid organizationId,
        [FromRoute] Guid userId,
        CancellationToken cancellationToken)
    {
        // Use transaction to prevent race condition when checking last admin
        await using var transaction = await _context.Database
            .BeginTransactionAsync(IsolationLevel.RepeatableRead, cancellationToken);

        // 1. Verify organization exists
        var organizationExists = await _context.Organizations
            .AnyAsync(o => o.Id == organizationId, cancellationToken);
        if (!organizationExists)
            throw NotFoundException.Organization(organizationId);

        // 2. Find membership
        var membership = await _context.OrganizationMembers
            .FirstOrDefaultAsync(m => m.OrganizationId == organizationId && m.UserId == userId, cancellationToken);
        if (membership == null)
            throw NotFoundException.Member(userId, organizationId);

        // 3. Check last admin rule
        if (membership.OrganizationRole == OrganizationRole.Admin)
        {
            var adminCount = await _context.OrganizationMembers
                .CountAsync(m => m.OrganizationId == organizationId && m.OrganizationRole == OrganizationRole.Admin, cancellationToken);
            if (adminCount <= 1)
                throw BusinessRuleException.CannotRemoveLastAdmin();
        }

        // 4. Remove membership
        _context.OrganizationMembers.Remove(membership);
        await _context.SaveChangesAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return NoContent();
    }
#endif

    /// <summary>
    /// Generates a username from an email address.
    /// </summary>
    private static string GenerateUsernameFromEmail(string email)
    {
        var atIndex = email.IndexOf('@');
        var username = atIndex > 0 ? email[..atIndex] : email;

        // Remove any characters that are not allowed in username
        return new string(username.Where(c =>
            char.IsLetterOrDigit(c) || c == '.' || c == '_' || c == '-').ToArray());
    }
}
