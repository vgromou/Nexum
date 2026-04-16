using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Common.Errors;
using Api.Data;
using Api.DTOs.Common;
using Api.DTOs.Organizations;
using Api.Exceptions;
using Api.Extensions;
using Api.Models;

namespace Api.Controllers.Organizations;

/// <summary>
/// Endpoints for managing organizations.
/// </summary>
[ApiController]
[Route("api/organizations")]
[Produces("application/json")]
[Tags("Organizations")]
[Authorize]
public partial class OrganizationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly TimeProvider _timeProvider;
    private readonly IWebHostEnvironment _environment;

    public OrganizationsController(
        ApplicationDbContext context,
        TimeProvider timeProvider,
        IWebHostEnvironment environment)
    {
        _context = context;
        _timeProvider = timeProvider;
        _environment = environment;
    }

    /// <summary>
    /// Create a new organization.
    /// </summary>
    /// <remarks>
    /// Creates a new organization. In single-tenant mode, only one organization can exist.
    ///
    /// **Auto-generation:**
    /// - If slug is not provided, it will be auto-generated from the organization name.
    /// - The slug must start with a letter and contain only lowercase letters, numbers, and hyphens.
    /// </remarks>
    /// <param name="request">Organization creation request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Created organization.</returns>
    /// <response code="201">Organization created successfully.</response>
    /// <response code="400">Invalid input data.</response>
    /// <response code="409">Organization already exists or slug is taken.</response>
    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(typeof(OrganizationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<OrganizationResponse>> CreateOrganization(
        [FromBody] CreateOrganizationRequest request,
        CancellationToken cancellationToken)
    {
        // Check if organization already exists (single-tenant constraint)
        var organizationExists = await _context.Organizations
            .AnyAsync(cancellationToken);

        if (organizationExists)
        {
            throw ConflictException.OrganizationExists();
        }

        // Generate or validate slug
        var slug = string.IsNullOrWhiteSpace(request.Slug)
            ? GenerateSlugFromName(request.Name)
            : request.Slug.Trim().ToLowerInvariant();

        // Check slug uniqueness
        var slugExists = await _context.Organizations
            .AnyAsync(o => o.Slug == slug, cancellationToken);

        if (slugExists)
        {
            throw ConflictException.SlugExists(slug);
        }

        var now = _timeProvider.GetUtcNow().UtcDateTime;

        // Create organization
        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Slug = slug,
            LogoUrl = request.LogoUrl?.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Organizations.Add(organization);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Handle race condition: another request created an organization between our check and save
            throw ConflictException.OrganizationExists();
        }

        var response = new OrganizationResponse
        {
            Id = organization.Id,
            Name = organization.Name,
            Slug = organization.Slug,
            LogoUrl = organization.LogoUrl,
            CreatedAt = organization.CreatedAt,
            UpdatedAt = organization.UpdatedAt
        };

        return CreatedAtAction(
            actionName: nameof(GetOrganization),
            routeValues: new { organizationId = organization.Id },
            value: response);
    }

    /// <summary>
    /// Get all organizations.
    /// </summary>
    /// <remarks>
    /// Retrieves all organizations in the system.
    /// In MVP (single-tenant mode), returns at most one organization or an empty array.
    ///
    /// **Authorization:** Requires authentication. Accessible to all organization members.
    /// </remarks>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of organizations.</returns>
    /// <response code="200">Organizations retrieved successfully.</response>
    /// <response code="401">Not authenticated.</response>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<OrganizationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResponse<OrganizationResponse>>> GetOrganizations(
        CancellationToken cancellationToken)
    {
        var organizations = await _context.Organizations
            .Select(o => new OrganizationResponse
            {
                Id = o.Id,
                Name = o.Name,
                Slug = o.Slug,
                LogoUrl = o.LogoUrl,
                CreatedAt = o.CreatedAt,
                UpdatedAt = o.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(PagedResponse.Create(organizations, page: 1, pageSize: organizations.Count, totalItems: organizations.Count));
    }

    /// <summary>
    /// Get organization by ID.
    /// </summary>
    /// <remarks>
    /// **Authorization:** Requires authentication. Accessible to all organization members.
    /// </remarks>
    /// <param name="organizationId">Organization unique identifier.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Organization details.</returns>
    /// <response code="200">Organization found.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="404">Organization not found.</response>
    [HttpGet("{organizationId:guid}")]
    [ProducesResponseType(typeof(OrganizationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrganizationResponse>> GetOrganization(
        [FromRoute] Guid organizationId,
        CancellationToken cancellationToken)
    {
        var organization = await _context.Organizations
            .FirstOrDefaultAsync(o => o.Id == organizationId, cancellationToken);

        if (organization == null)
        {
            throw NotFoundException.Organization(organizationId);
        }

        var response = new OrganizationResponse
        {
            Id = organization.Id,
            Name = organization.Name,
            Slug = organization.Slug,
            LogoUrl = organization.LogoUrl,
            CreatedAt = organization.CreatedAt,
            UpdatedAt = organization.UpdatedAt
        };

        return Ok(response);
    }

    /// <summary>
    /// Generates a URL-friendly slug from organization name.
    /// </summary>
    private static string GenerateSlugFromName(string name)
    {
        var slug = name.ToLowerInvariant().Replace(" ", "-");
        slug = NonAlphanumericHyphenRegex().Replace(slug, "");
        slug = MultipleHyphensRegex().Replace(slug, "-").Trim('-');

        // Ensure starts with letter
        if (slug.Length == 0 || !char.IsLetter(slug[0]))
        {
            slug = "org-" + slug;
        }

        return slug;
    }

    /// <summary>
    /// Delete an organization (TESTING ONLY).
    /// </summary>
    /// <remarks>
    /// ⚠️ **TESTING ONLY** - This endpoint is intended for test environments only.
    ///
    /// Permanently delete an organization and all associated data.
    /// This operation is irreversible.
    ///
    /// **Authorization:** Requires Admin role in the organization.
    ///
    /// **Required header:**
    /// - `X-Confirm-Delete: true` - Safety header to confirm deletion
    ///
    /// **Cascade deletion includes:**
    /// - All organization members (junction records)
    /// - All spaces within the organization
    /// - All pages and collections within those spaces
    /// - All organization settings
    /// </remarks>
    /// <param name="organizationId">Organization unique identifier.</param>
    /// <param name="confirmDelete">Safety header X-Confirm-Delete must be true.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>No content on success.</returns>
    /// <response code="204">Organization deleted successfully.</response>
    /// <response code="400">Missing X-Confirm-Delete header.</response>
    /// <response code="401">Not authenticated.</response>
    /// <response code="403">Not authorized to delete this organization.</response>
    /// <response code="404">Organization not found.</response>
    [HttpDelete("{organizationId:guid}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteOrganization(
        [FromRoute] Guid organizationId,
        [FromHeader(Name = "X-Confirm-Delete")] bool confirmDelete = false,
        CancellationToken cancellationToken = default)
    {
        if (!_environment.IsDevelopment() && _environment.EnvironmentName != "Testing")
        {
            return NotFound();
        }

        // Verify caller belongs to this organization
        var tokenOrgId = User.GetOrganizationId();
        if (tokenOrgId != organizationId)
        {
            throw ForbiddenException.InsufficientPermissions("delete this organization");
        }

        if (!confirmDelete)
        {
            throw new ValidationException(
                "Deletion requires X-Confirm-Delete: true header",
                new Dictionary<string, List<FieldError>>
                {
                    ["X-Confirm-Delete"] = [new FieldError
                    {
                        Code = ErrorCodes.VALIDATION_MISSING_CONFIRMATION,
                        Message = "X-Confirm-Delete header is required and must be true"
                    }]
                });
        }

        var organization = await _context.Organizations
            .FirstOrDefaultAsync(o => o.Id == organizationId, cancellationToken);

        if (organization == null)
        {
            throw NotFoundException.Organization(organizationId);
        }

        // Cascade delete is handled by database FK constraints
        _context.Organizations.Remove(organization);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [GeneratedRegex(@"[^a-z0-9-]")]
    private static partial Regex NonAlphanumericHyphenRegex();

    [GeneratedRegex(@"-+")]
    private static partial Regex MultipleHyphensRegex();
}
