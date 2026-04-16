using System.ComponentModel.DataAnnotations;
using Api.Models;
using Api.Validation;

namespace Api.DTOs.Spaces;

/// <summary>
/// Request body for creating a new space.
/// </summary>
public sealed class CreateSpaceRequest
{
    /// <summary>
    /// Space display name.
    /// </summary>
    /// <example>Engineering</example>
    [Required(ErrorMessage = "Name is required")]
    [MinLength(1, ErrorMessage = "Name must be at least 1 character")]
    [MaxLength(256, ErrorMessage = "Name must not exceed 256 characters")]
    public required string Name { get; init; }

    /// <summary>
    /// Space purpose description.
    /// </summary>
    /// <example>Engineering team workspace</example>
    [MaxLength(1000, ErrorMessage = "Description must not exceed 1000 characters")]
    public string? Description { get; init; }

    /// <summary>
    /// Emoji or icon identifier.
    /// </summary>
    /// <example>rocket</example>
    [MaxLength(100, ErrorMessage = "Icon must not exceed 100 characters")]
    public string? Icon { get; init; }

    /// <summary>
    /// URL-friendly identifier. Auto-generated from name if not provided.
    /// Must start with a letter and contain only lowercase letters, numbers, and hyphens.
    /// </summary>
    /// <example>engineering</example>
    [RegularExpression(@"^[a-z][a-z0-9-]*$", ErrorMessage = "Slug must start with a letter and contain only lowercase letters, numbers, and hyphens")]
    [MinLength(2, ErrorMessage = "Slug must be at least 2 characters")]
    [MaxLength(100, ErrorMessage = "Slug must not exceed 100 characters")]
    public string? Slug { get; init; }

    /// <summary>
    /// Default access level for organization members (private / viewer / editor).
    /// Defaults to Private if not provided.
    /// </summary>
    /// <example>Private</example>
    [AllowedSpaceRoles(SpaceRole.Private, SpaceRole.Viewer, SpaceRole.Editor)]
    public SpaceRole? DefaultAccess { get; init; }
}
