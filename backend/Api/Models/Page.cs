namespace Api.Models;

/// <summary>
/// Page entity - document that contains blocks
/// </summary>
public class Page : AuditableEntity
{
    public required string Title { get; set; }
    public string? Icon { get; set; }
    public string? IconColor { get; set; }
    public string? CoverImage { get; set; }
    public bool IsArchived { get; set; }
    public bool IsFavorite { get; set; }
    public int SortOrder { get; set; }
    
    // Foreign keys
    public Guid SpaceId { get; set; }
    public Guid? ParentPageId { get; set; }
    
    // Navigation properties
    public Space Space { get; set; } = null!;
    public Page? ParentPage { get; set; }
    public ICollection<Page> ChildPages { get; set; } = new List<Page>();
    public ICollection<Block> Blocks { get; set; } = new List<Block>();
}
