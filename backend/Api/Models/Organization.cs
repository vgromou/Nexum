namespace Api.Models;

/// <summary>
/// Organization entity - single-tenant instance settings
/// </summary>
public class Organization : AuditableEntity
{
    /// <summary>
    /// Organization display name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Unique URL-friendly identifier
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// Organization logo URL
    /// </summary>
    public string? LogoUrl { get; set; }

    // Navigation properties

    /// <summary>
    /// Users belonging to this organization
    /// </summary>
    public ICollection<User> Users { get; set; } = new List<User>();
}
