namespace Api.Models;

/// <summary>
/// Base entity with Id and creation timestamp
/// Use for immutable records (logs, audit trails)
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Base entity with audit fields (CreatedAt + UpdatedAt)
/// Use for mutable entities that can be modified
/// </summary>
public abstract class AuditableEntity : BaseEntity
{
    public DateTime UpdatedAt { get; set; }
}
