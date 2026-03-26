namespace Api.Models;

/// <summary>
/// Junction table for user-organization relationships.
/// Enables future multi-organization support while maintaining single-org MVP constraint.
/// </summary>
public class OrganizationMember : AuditableEntity
{
    /// <summary>
    /// Organization the user belongs to
    /// </summary>
    public Guid OrganizationId { get; set; }

    /// <summary>
    /// User who is a member of the organization
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// User's role within the organization
    /// </summary>
    public OrganizationRole OrganizationRole { get; set; } = OrganizationRole.User;

    /// <summary>
    /// When the user joined the organization
    /// </summary>
    public DateTime JoinedAt { get; set; }

    // Navigation properties

    /// <summary>
    /// The organization
    /// </summary>
    public Organization Organization { get; set; } = null!;

    /// <summary>
    /// The user
    /// </summary>
    public User User { get; set; } = null!;
}
