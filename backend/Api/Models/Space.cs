namespace Api.Models;

/// <summary>
/// Workspace/Space entity - top-level container for pages
/// </summary>
public class Space : AuditableEntity
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string? IconColor { get; set; }
    public int SortOrder { get; set; }
    
    // Navigation properties
    public ICollection<Page> Pages { get; set; } = new List<Page>();
}
