namespace Api.Models;

/// <summary>
/// Space-specific settings. Uses shared primary key with <see cref="Space"/> (1:1 relationship).
/// Created together with the space. Does not have its own CreatedAt — mirrors the parent space.
/// </summary>
public class SpaceSettings
{
    /// <summary>
    /// Primary key, shared with Space.Id
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Last time settings were modified
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    // Navigation properties

    /// <summary>
    /// The parent space
    /// </summary>
    public Space Space { get; set; } = null!;
}
