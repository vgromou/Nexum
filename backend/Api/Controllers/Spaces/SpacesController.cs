using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Common.Errors;
using Api.Data;
using Api.DTOs.Common;
using Api.DTOs.Spaces;
using Api.Exceptions;
using Api.Extensions;
using Api.Filters;
using Api.Models;

namespace Api.Controllers.Spaces;

/// <summary>
/// Endpoints for managing spaces and space membership.
/// </summary>
[ApiController]
[Route("api/spaces")]
[Produces("application/json")]
[Tags("Spaces")]
[Authorize]
[RequireValidClaims]
public partial class SpacesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly TimeProvider _timeProvider;

    public SpacesController(
        ApplicationDbContext context,
        TimeProvider timeProvider)
    {
        _context = context;
        _timeProvider = timeProvider;
    }

    #region Spaces CRUD

    /// <summary>
    /// Get a list of spaces accessible to the current user.
    /// </summary>
    /// <remarks>
    /// Applies access control filtering:
    /// - **Org Admin**: sees ALL spaces regardless of default_access
    /// - **Regular user**: sees public spaces (default_access = Viewer/Editor) and spaces with explicit membership
    ///
    /// **Filtering:**
    /// - `search`: partial match on space name (case-insensitive)
    /// - `owner`: partial match on owner display name (case-insensitive)
    /// - `isArchived`: include archived spaces (default: false)
    /// </remarks>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<SpaceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResponse<SpaceResponse>>> GetSpaces(
        [FromQuery] GetSpacesQueryParameters query,
        CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetValidatedUserId();
        var orgId = HttpContext.GetValidatedOrganizationId();
        var isOrgAdmin = await IsOrgAdmin(userId, orgId, cancellationToken);

        // Base query: all spaces in user's organization
        var spacesQuery = _context.Spaces
            .Where(s => s.OrganizationId == orgId)
            .AsQueryable();

        // Access control: regular users only see accessible spaces
        if (!isOrgAdmin)
        {
            spacesQuery = spacesQuery.Where(s =>
                s.DefaultAccess != SpaceRole.Private ||
                s.Members.Any(m => m.UserId == userId));
        }

        // Filter: isArchived
        if (!query.IncludeArchived)
            spacesQuery = spacesQuery.Where(s => !s.IsArchived);

        // Filter: search by name
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var searchLower = query.Search.ToLower();
            spacesQuery = spacesQuery.Where(s => s.Name.ToLower().Contains(searchLower));
        }

        // Filter: owner by display name
        if (!string.IsNullOrWhiteSpace(query.Owner))
        {
            var ownerLower = query.Owner.ToLower();
            spacesQuery = spacesQuery.Where(s =>
                s.Members.Any(m =>
                    m.Role == SpaceRole.Owner &&
                    (m.User.FirstName.ToLower() + " " + m.User.LastName.ToLower()).Contains(ownerLower)));
        }

        // Total count before pagination
        var totalItems = await spacesQuery.CountAsync(cancellationToken);

        // Sort by name, then paginate
        var spaces = await spacesQuery
            .OrderBy(s => s.Name)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Include(s => s.Members)
                .ThenInclude(m => m.User)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        var items = spaces.Select(s => MapToSpaceResponse(s, userId, isOrgAdmin)).ToList();

        return Ok(PagedResponse.Create(items, query.Page, query.PageSize, totalItems));
    }

    /// <summary>
    /// Get detailed information about a specific space.
    /// </summary>
    [HttpGet("{spaceId:guid}")]
    [ProducesResponseType(typeof(SpaceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SpaceResponse>> GetSpace(
        [FromRoute] Guid spaceId,
        CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetValidatedUserId();
        var orgId = HttpContext.GetValidatedOrganizationId();

        var space = await _context.Spaces
            .Include(s => s.Members)
                .ThenInclude(m => m.User)
            .AsSplitQuery()
            .FirstOrDefaultAsync(s => s.Id == spaceId && s.OrganizationId == orgId, cancellationToken);

        if (space == null)
        {
            throw NotFoundException.ForResource("Space", spaceId);
        }

        var isOrgAdmin = await IsOrgAdmin(userId, orgId, cancellationToken);
        EnsureSpaceAccess(space, userId, isOrgAdmin);

        return Ok(MapToSpaceResponse(space, userId, isOrgAdmin));
    }

    /// <summary>
    /// Create a new space. The creator automatically becomes the Owner.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SpaceResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SpaceResponse>> CreateSpace(
        [FromBody] CreateSpaceRequest request,
        CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetValidatedUserId();
        var orgId = HttpContext.GetValidatedOrganizationId();
        var now = _timeProvider.GetUtcNow().UtcDateTime;

        // Generate or validate slug
        var slug = string.IsNullOrWhiteSpace(request.Slug)
            ? GenerateSlugFromName(request.Name)
            : request.Slug.Trim().ToLowerInvariant();

        // Check slug uniqueness within organization
        var slugExists = await _context.Spaces
            .AnyAsync(s => s.OrganizationId == orgId && s.Slug == slug, cancellationToken);

        if (slugExists)
        {
            throw ConflictException.SlugExists(slug);
        }

        // Validate default access
        var defaultAccess = request.DefaultAccess ?? SpaceRole.Private;
        ValidateDefaultAccess(defaultAccess);

        // Create space
        var space = new Space
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Icon = request.Icon?.Trim(),
            Slug = slug,
            DefaultAccess = defaultAccess,
            IsArchived = false,
            CreatedAt = now,
            UpdatedAt = now
        };

        // Creator becomes Owner
        var ownerMember = new SpaceMember
        {
            Id = Guid.NewGuid(),
            SpaceId = space.Id,
            UserId = userId,
            Role = SpaceRole.Owner,
            JoinedAt = now,
            InvitedBy = null,
            CreatedAt = now,
            UpdatedAt = now
        };

        // Create settings (1:1)
        var settings = new SpaceSettings
        {
            Id = space.Id,
            UpdatedAt = now
        };

        _context.Spaces.Add(space);
        _context.SpaceMembers.Add(ownerMember);
        _context.SpaceSettings.Add(settings);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            throw ConflictException.SlugExists(slug);
        }

        // Reload with navigation properties for response
        await _context.Entry(ownerMember).Reference(m => m.User).LoadAsync(cancellationToken);
        space.Members = new List<SpaceMember> { ownerMember };

        var response = MapToSpaceResponse(space, userId, isOrgAdmin: false);

        return CreatedAtAction(
            actionName: nameof(GetSpace),
            routeValues: new { spaceId = space.Id },
            value: response);
    }

    /// <summary>
    /// Update space properties. Only Owner, Administrator, or Org Admin can update.
    /// </summary>
    [HttpPatch("{spaceId:guid}")]
    [ProducesResponseType(typeof(SpaceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SpaceResponse>> UpdateSpace(
        [FromRoute] Guid spaceId,
        [FromBody] UpdateSpaceRequest request,
        CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetValidatedUserId();
        var orgId = HttpContext.GetValidatedOrganizationId();

        var space = await _context.Spaces
            .Include(s => s.Members)
                .ThenInclude(m => m.User)
            .AsSplitQuery()
            .FirstOrDefaultAsync(s => s.Id == spaceId && s.OrganizationId == orgId, cancellationToken);

        if (space == null)
        {
            throw NotFoundException.ForResource("Space", spaceId);
        }

        var isOrgAdmin = await IsOrgAdmin(userId, orgId, cancellationToken);
        EnsureSpaceManageAccess(space, userId, isOrgAdmin);

        if (space.IsArchived)
        {
            throw BusinessRuleException.NotAllowed("Cannot update an archived space");
        }

        // Apply updates
        if (request.Name != null)
        {
            space.Name = request.Name.Trim();
        }

        if (request.Description != null)
        {
            space.Description = request.Description.Trim();
        }

        if (request.Icon != null)
        {
            space.Icon = request.Icon.Trim();
        }

        if (request.Slug != null)
        {
            var newSlug = request.Slug.Trim().ToLowerInvariant();
            if (newSlug != space.Slug)
            {
                var slugExists = await _context.Spaces
                    .AnyAsync(s => s.OrganizationId == orgId && s.Slug == newSlug && s.Id != spaceId, cancellationToken);

                if (slugExists)
                {
                    throw ConflictException.SlugExists(newSlug);
                }

                space.Slug = newSlug;
            }
        }

        if (request.DefaultAccess.HasValue)
        {
            ValidateDefaultAccess(request.DefaultAccess.Value);
            space.DefaultAccess = request.DefaultAccess.Value;
        }

        space.UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(MapToSpaceResponse(space, userId, isOrgAdmin));
    }

    /// <summary>
    /// Archive a space. Archived spaces become read-only.
    /// </summary>
    [HttpPost("{spaceId:guid}/archive")]
    [ProducesResponseType(typeof(SpaceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SpaceResponse>> ArchiveSpace(
        [FromRoute] Guid spaceId,
        CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetValidatedUserId();
        var orgId = HttpContext.GetValidatedOrganizationId();

        var space = await _context.Spaces
            .Include(s => s.Members).ThenInclude(m => m.User)
            .AsSplitQuery()
            .FirstOrDefaultAsync(s => s.Id == spaceId && s.OrganizationId == orgId, cancellationToken);

        if (space == null)
        {
            throw NotFoundException.ForResource("Space", spaceId);
        }

        var isOrgAdmin = await IsOrgAdmin(userId, orgId, cancellationToken);
        EnsureSpaceManageAccess(space, userId, isOrgAdmin);

        if (space.IsArchived)
        {
            throw BusinessRuleException.InvalidState("archived", "archived");
        }

        space.IsArchived = true;
        space.UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(MapToSpaceResponse(space, userId, isOrgAdmin));
    }

    /// <summary>
    /// Unarchive a previously archived space.
    /// </summary>
    [HttpPost("{spaceId:guid}/unarchive")]
    [ProducesResponseType(typeof(SpaceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SpaceResponse>> UnarchiveSpace(
        [FromRoute] Guid spaceId,
        CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetValidatedUserId();
        var orgId = HttpContext.GetValidatedOrganizationId();

        var space = await _context.Spaces
            .Include(s => s.Members).ThenInclude(m => m.User)
            .AsSplitQuery()
            .FirstOrDefaultAsync(s => s.Id == spaceId && s.OrganizationId == orgId, cancellationToken);

        if (space == null)
        {
            throw NotFoundException.ForResource("Space", spaceId);
        }

        var isOrgAdmin = await IsOrgAdmin(userId, orgId, cancellationToken);
        EnsureSpaceManageAccess(space, userId, isOrgAdmin);

        if (!space.IsArchived)
        {
            throw BusinessRuleException.InvalidState("active", "active");
        }

        space.IsArchived = false;
        space.UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(MapToSpaceResponse(space, userId, isOrgAdmin));
    }

    #endregion

    #region Membership

    /// <summary>
    /// Get list of explicit members of a space.
    /// </summary>
    [HttpGet("{spaceId:guid}/members")]
    [ProducesResponseType(typeof(List<SpaceMemberResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<SpaceMemberResponse>>> GetMembers(
        [FromRoute] Guid spaceId,
        [FromQuery] SpaceRole? role,
        CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetValidatedUserId();
        var orgId = HttpContext.GetValidatedOrganizationId();

        var space = await _context.Spaces
            .Include(s => s.Members).ThenInclude(m => m.User)
            .Include(s => s.Members).ThenInclude(m => m.InvitedByUser)
            .AsSplitQuery()
            .FirstOrDefaultAsync(s => s.Id == spaceId && s.OrganizationId == orgId, cancellationToken);

        if (space == null)
        {
            throw NotFoundException.ForResource("Space", spaceId);
        }

        var isOrgAdmin = await IsOrgAdmin(userId, orgId, cancellationToken);
        EnsureSpaceAccess(space, userId, isOrgAdmin);

        var members = space.Members.AsEnumerable();

        if (role.HasValue)
        {
            members = members.Where(m => m.Role == role.Value);
        }

        var response = members
            .OrderBy(m => m.Role)
            .ThenBy(m => m.User.FirstName)
            .Select(MapToSpaceMemberResponse)
            .ToList();

        return Ok(response);
    }

    /// <summary>
    /// Add a member to a space.
    /// </summary>
    [HttpPost("{spaceId:guid}/members")]
    [ProducesResponseType(typeof(SpaceMemberResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SpaceMemberResponse>> AddMember(
        [FromRoute] Guid spaceId,
        [FromBody] AddSpaceMemberRequest request,
        CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetValidatedUserId();
        var orgId = HttpContext.GetValidatedOrganizationId();

        var space = await _context.Spaces
            .Include(s => s.Members)
            .FirstOrDefaultAsync(s => s.Id == spaceId && s.OrganizationId == orgId, cancellationToken);

        if (space == null)
        {
            throw NotFoundException.ForResource("Space", spaceId);
        }

        if (space.IsArchived)
        {
            throw BusinessRuleException.NotAllowed("Cannot add members to an archived space");
        }

        var isOrgAdmin = await IsOrgAdmin(userId, orgId, cancellationToken);
        EnsureSpaceManageAccess(space, userId, isOrgAdmin);

        // Validate role
        if (request.Role == SpaceRole.Owner || request.Role == SpaceRole.Private)
        {
            throw new ValidationException(
                "Role must be Administrator, Editor, or Viewer",
                new Dictionary<string, List<FieldError>>
                {
                    ["role"] = [new FieldError { Code = ErrorCodes.VALIDATION_INVALID_VALUE, Message = "Cannot assign Owner or Private role via this endpoint" }]
                });
        }

        // Administrator can only add editors and viewers
        var callerMember = space.Members.FirstOrDefault(m => m.UserId == userId);
        if (!isOrgAdmin && callerMember?.Role == SpaceRole.Administrator && request.Role == SpaceRole.Administrator)
        {
            throw ForbiddenException.InsufficientPermissions("assign Administrator role");
        }

        // Check user is an active org member
        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId && u.IsActive, cancellationToken);

        if (targetUser == null)
        {
            throw NotFoundException.ForResource("User", request.UserId);
        }

        var isOrgMember = await _context.OrganizationMembers
            .AnyAsync(m => m.UserId == request.UserId && m.OrganizationId == orgId, cancellationToken);

        if (!isOrgMember)
        {
            throw NotFoundException.ForResource("Organization member", request.UserId);
        }

        // Check not already a member
        if (space.Members.Any(m => m.UserId == request.UserId))
        {
            throw ConflictException.AlreadyExists("Space member");
        }

        var now = _timeProvider.GetUtcNow().UtcDateTime;

        var member = new SpaceMember
        {
            Id = Guid.NewGuid(),
            SpaceId = spaceId,
            UserId = request.UserId,
            Role = request.Role,
            JoinedAt = now,
            InvitedBy = userId,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.SpaceMembers.Add(member);
        await _context.SaveChangesAsync(cancellationToken);

        // Load navigation for response
        await _context.Entry(member).Reference(m => m.User).LoadAsync(cancellationToken);
        await _context.Entry(member).Reference(m => m.InvitedByUser).LoadAsync(cancellationToken);

        return StatusCode(StatusCodes.Status201Created, MapToSpaceMemberResponse(member));
    }

    /// <summary>
    /// Change a space member's role.
    /// </summary>
    [HttpPatch("{spaceId:guid}/members/{targetUserId:guid}")]
    [ProducesResponseType(typeof(SpaceMemberResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SpaceMemberResponse>> UpdateMemberRole(
        [FromRoute] Guid spaceId,
        [FromRoute] Guid targetUserId,
        [FromBody] UpdateSpaceMemberRequest request,
        CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetValidatedUserId();
        var orgId = HttpContext.GetValidatedOrganizationId();

        var space = await _context.Spaces
            .Include(s => s.Members).ThenInclude(m => m.User)
            .Include(s => s.Members).ThenInclude(m => m.InvitedByUser)
            .AsSplitQuery()
            .FirstOrDefaultAsync(s => s.Id == spaceId && s.OrganizationId == orgId, cancellationToken);

        if (space == null)
        {
            throw NotFoundException.ForResource("Space", spaceId);
        }

        if (space.IsArchived)
        {
            throw BusinessRuleException.NotAllowed("Cannot modify roles in an archived space");
        }

        var isOrgAdmin = await IsOrgAdmin(userId, orgId, cancellationToken);
        EnsureSpaceManageAccess(space, userId, isOrgAdmin);

        // Validate role
        if (request.Role == SpaceRole.Owner || request.Role == SpaceRole.Private)
        {
            throw new ValidationException(
                "Role must be Administrator, Editor, or Viewer",
                new Dictionary<string, List<FieldError>>
                {
                    ["role"] = [new FieldError { Code = ErrorCodes.VALIDATION_INVALID_VALUE, Message = "Use transfer-ownership endpoint to assign Owner role" }]
                });
        }

        var targetMember = space.Members.FirstOrDefault(m => m.UserId == targetUserId);
        if (targetMember == null)
        {
            throw NotFoundException.ForResource("Space member", targetUserId);
        }

        // Cannot change Owner's role
        if (targetMember.Role == SpaceRole.Owner)
        {
            throw BusinessRuleException.NotAllowed("Cannot change Owner's role. Use transfer-ownership endpoint");
        }

        // Administrator cannot promote/demote other Administrators
        var callerMember = space.Members.FirstOrDefault(m => m.UserId == userId);
        if (!isOrgAdmin && callerMember?.Role == SpaceRole.Administrator &&
            (targetMember.Role == SpaceRole.Administrator || request.Role == SpaceRole.Administrator))
        {
            throw ForbiddenException.InsufficientPermissions("modify Administrator roles");
        }

        targetMember.Role = request.Role;
        targetMember.UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(MapToSpaceMemberResponse(targetMember));
    }

    /// <summary>
    /// Remove a member from a space.
    /// </summary>
    [HttpDelete("{spaceId:guid}/members/{targetUserId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> RemoveMember(
        [FromRoute] Guid spaceId,
        [FromRoute] Guid targetUserId,
        CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetValidatedUserId();
        var orgId = HttpContext.GetValidatedOrganizationId();

        var space = await _context.Spaces
            .Include(s => s.Members)
            .FirstOrDefaultAsync(s => s.Id == spaceId && s.OrganizationId == orgId, cancellationToken);

        if (space == null)
        {
            throw NotFoundException.ForResource("Space", spaceId);
        }

        if (space.IsArchived)
        {
            throw BusinessRuleException.NotAllowed("Cannot modify membership of an archived space");
        }

        var isOrgAdmin = await IsOrgAdmin(userId, orgId, cancellationToken);
        var isSelfRemoval = userId == targetUserId;

        // Self-removal is allowed for non-owners
        if (!isSelfRemoval)
        {
            EnsureSpaceManageAccess(space, userId, isOrgAdmin);
        }

        var targetMember = space.Members.FirstOrDefault(m => m.UserId == targetUserId);
        if (targetMember == null)
        {
            throw NotFoundException.ForResource("Space member", targetUserId);
        }

        // Cannot remove last Owner
        if (targetMember.Role == SpaceRole.Owner)
        {
            var ownerCount = space.Members.Count(m => m.Role == SpaceRole.Owner);
            if (ownerCount <= 1)
            {
                throw BusinessRuleException.NotAllowed("Cannot remove the last Owner. Transfer ownership first");
            }
        }

        // Administrator cannot remove other Administrators or Owners
        var callerMember = space.Members.FirstOrDefault(m => m.UserId == userId);
        if (!isSelfRemoval && !isOrgAdmin &&
            callerMember?.Role == SpaceRole.Administrator &&
            (targetMember.Role == SpaceRole.Administrator || targetMember.Role == SpaceRole.Owner))
        {
            throw ForbiddenException.InsufficientPermissions("remove this member");
        }

        _context.SpaceMembers.Remove(targetMember);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Transfer space ownership to another Administrator.
    /// </summary>
    [HttpPost("{spaceId:guid}/transfer-ownership")]
    [ProducesResponseType(typeof(SpaceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SpaceResponse>> TransferOwnership(
        [FromRoute] Guid spaceId,
        [FromBody] TransferOwnershipRequest request,
        CancellationToken cancellationToken)
    {
        var userId = HttpContext.GetValidatedUserId();
        var orgId = HttpContext.GetValidatedOrganizationId();

        var space = await _context.Spaces
            .Include(s => s.Members).ThenInclude(m => m.User)
            .AsSplitQuery()
            .FirstOrDefaultAsync(s => s.Id == spaceId && s.OrganizationId == orgId, cancellationToken);

        if (space == null)
        {
            throw NotFoundException.ForResource("Space", spaceId);
        }

        var isOrgAdmin = await IsOrgAdmin(userId, orgId, cancellationToken);

        // Only current Owner or Org Admin can transfer
        var currentOwner = space.Members.FirstOrDefault(m => m.Role == SpaceRole.Owner);
        if (currentOwner?.UserId != userId && !isOrgAdmin)
        {
            throw ForbiddenException.InsufficientPermissions("transfer ownership of this space");
        }

        // New owner must be a current Administrator
        var newOwnerMember = space.Members.FirstOrDefault(m => m.UserId == request.NewOwnerId);
        if (newOwnerMember == null)
        {
            throw NotFoundException.ForResource("Space member", request.NewOwnerId);
        }

        if (newOwnerMember.Role != SpaceRole.Administrator)
        {
            throw new ValidationException(
                "New owner must be a current Administrator",
                new Dictionary<string, List<FieldError>>
                {
                    ["newOwnerId"] = [new FieldError { Code = ErrorCodes.VALIDATION_INVALID_VALUE, Message = "Target user must have Administrator role" }]
                });
        }

        var now = _timeProvider.GetUtcNow().UtcDateTime;

        // Transfer: new owner becomes Owner, old owner becomes Administrator
        newOwnerMember.Role = SpaceRole.Owner;
        newOwnerMember.UpdatedAt = now;

        if (currentOwner != null)
        {
            currentOwner.Role = SpaceRole.Administrator;
            currentOwner.UpdatedAt = now;
        }

        space.UpdatedAt = now;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(MapToSpaceResponse(space, userId, isOrgAdmin));
    }

    #endregion

    #region Private Helpers

    /// <summary>
    /// Check if user is an organization admin.
    /// </summary>
    private async Task<bool> IsOrgAdmin(Guid userId, Guid orgId, CancellationToken ct)
    {
        return await _context.OrganizationMembers
            .AnyAsync(m => m.UserId == userId &&
                           m.OrganizationId == orgId &&
                           m.OrganizationRole == OrganizationRole.Admin, ct);
    }

    /// <summary>
    /// Ensure user has at least viewer access to the space.
    /// </summary>
    private static void EnsureSpaceAccess(Space space, Guid userId, bool isOrgAdmin)
    {
        if (isOrgAdmin) return;

        var hasMembership = space.Members.Any(m => m.UserId == userId);
        if (hasMembership) return;

        if (space.DefaultAccess == SpaceRole.Private)
        {
            throw ForbiddenException.InsufficientPermissions("access this space");
        }
    }

    /// <summary>
    /// Ensure user has Owner/Administrator access to manage the space.
    /// </summary>
    private static void EnsureSpaceManageAccess(Space space, Guid userId, bool isOrgAdmin)
    {
        if (isOrgAdmin) return;

        var member = space.Members.FirstOrDefault(m => m.UserId == userId);
        if (member == null || (member.Role != SpaceRole.Owner && member.Role != SpaceRole.Administrator))
        {
            throw ForbiddenException.InsufficientPermissions("manage this space");
        }
    }

    /// <summary>
    /// Validate that default access is not Owner or Administrator.
    /// </summary>
    private static void ValidateDefaultAccess(SpaceRole defaultAccess)
    {
        if (defaultAccess == SpaceRole.Owner || defaultAccess == SpaceRole.Administrator)
        {
            throw new ValidationException(
                "Default access must be Private, Viewer, or Editor",
                new Dictionary<string, List<FieldError>>
                {
                    ["defaultAccess"] = [new FieldError { Code = ErrorCodes.VALIDATION_INVALID_VALUE, Message = "Default access cannot be Owner or Administrator" }]
                });
        }
    }

    /// <summary>
    /// Compute the user's effective role in a space.
    /// </summary>
    private static SpaceRole GetEffectiveRole(Space space, Guid userId, bool isOrgAdmin)
    {
        var member = space.Members.FirstOrDefault(m => m.UserId == userId);
        if (member != null) return member.Role;

        if (isOrgAdmin) return SpaceRole.Administrator;

        return space.DefaultAccess;
    }

    /// <summary>
    /// Map Space entity to SpaceResponse DTO.
    /// </summary>
    private static SpaceResponse MapToSpaceResponse(Space space, Guid userId, bool isOrgAdmin)
    {
        var owner = space.Members.FirstOrDefault(m => m.Role == SpaceRole.Owner);

        return new SpaceResponse
        {
            Id = space.Id,
            Name = space.Name,
            Description = space.Description,
            Icon = space.Icon,
            Slug = space.Slug,
            DefaultAccess = space.DefaultAccess,
            IsArchived = space.IsArchived,
            Owner = owner != null
                ? new SpaceUserSummary
                {
                    Id = owner.User.Id,
                    DisplayName = $"{owner.User.FirstName} {owner.User.LastName}".Trim(),
                    AvatarUrl = owner.User.AvatarUrl
                }
                : new SpaceUserSummary
                {
                    Id = Guid.Empty,
                    DisplayName = "Unknown"
                },
            RoleInSpace = GetEffectiveRole(space, userId, isOrgAdmin),
            MemberCount = space.Members.Count,
            CollectionsCount = 0, // TODO: implement when Collections feature is ready
            CreatedAt = space.CreatedAt,
            UpdatedAt = space.UpdatedAt
        };
    }

    /// <summary>
    /// Map SpaceMember entity to SpaceMemberResponse DTO.
    /// </summary>
    private static SpaceMemberResponse MapToSpaceMemberResponse(SpaceMember member)
    {
        return new SpaceMemberResponse
        {
            Id = member.Id,
            UserId = member.User.Id,
            DisplayName = $"{member.User.FirstName} {member.User.LastName}".Trim(),
            Email = member.User.Email,
            AvatarUrl = member.User.AvatarUrl,
            Role = member.Role,
            JoinedAt = member.JoinedAt,
            InvitedBy = member.InvitedByUser != null
                ? new SpaceUserSummary
                {
                    Id = member.InvitedByUser.Id,
                    DisplayName = $"{member.InvitedByUser.FirstName} {member.InvitedByUser.LastName}".Trim(),
                    AvatarUrl = member.InvitedByUser.AvatarUrl
                }
                : null
        };
    }

    /// <summary>
    /// Generates a URL-friendly slug from a name.
    /// </summary>
    private static string GenerateSlugFromName(string name)
    {
        var slug = name.ToLowerInvariant().Replace(" ", "-");
        slug = NonAlphanumericHyphenRegex().Replace(slug, "");
        slug = MultipleHyphensRegex().Replace(slug, "-").Trim('-');

        if (slug.Length == 0 || !char.IsLetter(slug[0]))
        {
            slug = "space-" + slug;
        }

        return slug;
    }

    [GeneratedRegex(@"[^a-z0-9-]")]
    private static partial Regex NonAlphanumericHyphenRegex();

    [GeneratedRegex(@"-+")]
    private static partial Regex MultipleHyphensRegex();

    #endregion
}
