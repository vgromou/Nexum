namespace Api.Models;

/// <summary>
/// Isolated workspace within an organization.
/// Contains documents, tasks, and other content with role-based access control.
/// </summary>
public class Space : AuditableEntity
{
    /// <summary>
    /// Organization this space belongs to
    /// </summary>
    public Guid OrganizationId { get; set; }

    /// <summary>
    /// Display name of the space
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Optional description of the space purpose
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Optional icon identifier (emoji or icon name)
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// URL-friendly identifier, unique within organization
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// Default access level for organization members who are not explicit space members.
    /// Private means only explicit members can access.
    /// </summary>
    public SpaceRole DefaultAccess { get; set; } = SpaceRole.Private;

    /// <summary>
    /// Whether the space is archived (soft-deleted)
    /// </summary>
    public bool IsArchived { get; set; }

    // Navigation properties

    /// <summary>
    /// The parent organization
    /// </summary>
    public Organization Organization { get; set; } = null!;

    /// <summary>
    /// Explicit members of this space
    /// </summary>
    public ICollection<SpaceMember> Members { get; set; } = new List<SpaceMember>();

    /// <summary>
    /// Space-specific settings (1:1, created together with space)
    /// </summary>
    public SpaceSettings? Settings { get; set; }
}
