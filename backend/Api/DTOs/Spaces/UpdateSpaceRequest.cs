using System.ComponentModel.DataAnnotations;
using Api.Models;

namespace Api.DTOs.Spaces;

/// <summary>
/// Request body for updating a space. All fields optional (JSON Merge Patch semantics).
/// </summary>
public sealed class UpdateSpaceRequest
{
    /// <summary>
    /// New display name.
    /// </summary>
    /// <example>Engineering v2</example>
    [MinLength(1, ErrorMessage = "Name must be at least 1 character")]
    [MaxLength(256, ErrorMessage = "Name must not exceed 256 characters")]
    public string? Name { get; init; }

    /// <summary>
    /// New description. Send null to clear.
    /// </summary>
    /// <example>Updated engineering workspace</example>
    [MaxLength(1000, ErrorMessage = "Description must not exceed 1000 characters")]
    public string? Description { get; init; }

    /// <summary>
    /// New icon. Send null to clear.
    /// </summary>
    /// <example>wrench</example>
    [MaxLength(100, ErrorMessage = "Icon must not exceed 100 characters")]
    public string? Icon { get; init; }

    /// <summary>
    /// New URL-friendly identifier (unique per organization).
    /// Must start with a letter and contain only lowercase letters, numbers, and hyphens.
    /// </summary>
    /// <example>engineering-v2</example>
    [RegularExpression(@"^[a-z][a-z0-9-]*$", ErrorMessage = "Slug must start with a letter and contain only lowercase letters, numbers, and hyphens")]
    [MinLength(2, ErrorMessage = "Slug must be at least 2 characters")]
    [MaxLength(100, ErrorMessage = "Slug must not exceed 100 characters")]
    public string? Slug { get; init; }

    /// <summary>
    /// New default access level (private / viewer / editor).
    /// </summary>
    /// <example>Viewer</example>
    public SpaceRole? DefaultAccess { get; init; }
}
