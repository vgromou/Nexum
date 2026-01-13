namespace Api.Models;

/// <summary>
/// Block entity - content block within a page
/// </summary>
public class Block : AuditableEntity
{
    public required string Type { get; set; }  // paragraph, heading1, heading2, heading3, bulletList, numberedList, todo, quote, code, divider, image
    public string Content { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public int IndentLevel { get; set; }
    
    // For todo blocks
    public bool? IsChecked { get; set; }
    
    // For code blocks
    public string? Language { get; set; }
    
    // For image blocks
    public string? ImageUrl { get; set; }
    public string? ImageCaption { get; set; }
    
    // Block properties stored as JSON
    public string? Properties { get; set; }
    
    // Foreign keys
    public Guid PageId { get; set; }
    public Guid? ParentBlockId { get; set; }
    
    // Navigation properties
    public Page Page { get; set; } = null!;
    public Block? ParentBlock { get; set; }
    public ICollection<Block> ChildBlocks { get; set; } = new List<Block>();
}
