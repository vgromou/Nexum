using System.ComponentModel.DataAnnotations;
using Api.Models;
using Api.Validation;

namespace Api.DTOs.Spaces;

/// <summary>
/// Request body for adding a member to a space.
/// </summary>
public sealed class AddSpaceMemberRequest
{
    /// <summary>
    /// User to add to the space. Must be an active organization member.
    /// </summary>
    /// <example>550e8400-e29b-41d4-a716-446655440001</example>
    [Required(ErrorMessage = "UserId is required")]
    public required Guid UserId { get; init; }

    /// <summary>
    /// Role to assign (administrator / editor / viewer). Cannot be owner or private.
    /// </summary>
    /// <example>Editor</example>
    [Required(ErrorMessage = "Role is required")]
    [AllowedSpaceRoles(SpaceRole.Administrator, SpaceRole.Editor, SpaceRole.Viewer)]
    public required SpaceRole Role { get; init; }
}
