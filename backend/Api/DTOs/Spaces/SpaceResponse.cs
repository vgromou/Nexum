using System.Text.Json.Serialization;
using Api.Models;

namespace Api.DTOs.Spaces;

/// <summary>
/// Universal response DTO for all space operations.
/// Used in list (PagedResponse&lt;SpaceResponse&gt;) and single-space endpoints.
/// </summary>
public sealed class SpaceResponse
{
    /// <summary>
    /// Space unique identifier.
    /// </summary>
    /// <example>550e8400-e29b-41d4-a716-446655440000</example>
    public required Guid Id { get; init; }

    /// <summary>
    /// Display name of the space.
    /// </summary>
    /// <example>Engineering</example>
    public required string Name { get; init; }

    /// <summary>
    /// Purpose description of the space.
    /// </summary>
    /// <example>Engineering team workspace</example>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Description { get; init; }

    /// <summary>
    /// Emoji or icon identifier.
    /// </summary>
    /// <example>rocket</example>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Icon { get; init; }

    /// <summary>
    /// URL-friendly identifier.
    /// </summary>
    /// <example>engineering</example>
    public required string Slug { get; init; }

    /// <summary>
    /// Default access level for organization members (private / viewer / editor).
    /// </summary>
    /// <example>Private</example>
    public required SpaceRole DefaultAccess { get; init; }

    /// <summary>
    /// Whether the space is archived.
    /// </summary>
    /// <example>false</example>
    public required bool IsArchived { get; init; }

    /// <summary>
    /// Space owner information.
    /// </summary>
    public required SpaceUserSummary Owner { get; init; }

    /// <summary>
    /// Current user's effective role in the space.
    /// </summary>
    /// <example>Editor</example>
    public required SpaceRole RoleInSpace { get; init; }

    /// <summary>
    /// How the user got access to this space.
    /// </summary>
    /// <example>explicit</example>
    public required AccessSource AccessSource { get; init; }

    /// <summary>
    /// Number of explicit members in the space.
    /// </summary>
    /// <example>5</example>
    public required int MemberCount { get; init; }

    /// <summary>
    /// Number of collections in the space.
    /// </summary>
    /// <example>0</example>
    public required int CollectionsCount { get; init; }

    /// <summary>
    /// When the space was created.
    /// </summary>
    /// <example>2026-01-15T10:30:00Z</example>
    public required DateTime CreatedAt { get; init; }

    /// <summary>
    /// When the space was last updated.
    /// </summary>
    /// <example>2026-01-15T10:30:00Z</example>
    public required DateTime UpdatedAt { get; init; }
}
