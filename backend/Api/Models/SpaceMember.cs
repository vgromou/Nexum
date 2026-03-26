namespace Api.Models;

/// <summary>
/// Explicit membership of a user in a space with a specific role.
/// </summary>
public class SpaceMember : AuditableEntity
{
    /// <summary>
    /// Space the user is a member of
    /// </summary>
    public Guid SpaceId { get; set; }

    /// <summary>
    /// User who is a member of the space
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// User's role within the space (must not be Private)
    /// </summary>
    public SpaceRole Role { get; set; }

    /// <summary>
    /// When the user joined the space
    /// </summary>
    public DateTime JoinedAt { get; set; }

    /// <summary>
    /// User who invited this member (null if joined by other means)
    /// </summary>
    public Guid? InvitedBy { get; set; }

    // Navigation properties

    /// <summary>
    /// The space
    /// </summary>
    public Space Space { get; set; } = null!;

    /// <summary>
    /// The user
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// The user who sent the invitation
    /// </summary>
    public User? InvitedByUser { get; set; }
}
