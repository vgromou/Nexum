using System.ComponentModel.DataAnnotations;
using Api.Models;

namespace Api.DTOs.Spaces;

/// <summary>
/// Request body for updating a space member's role.
/// </summary>
public sealed class UpdateSpaceMemberRequest
{
    /// <summary>
    /// New role for the member (administrator / editor / viewer). Cannot be owner or private.
    /// </summary>
    /// <example>Administrator</example>
    [Required(ErrorMessage = "Role is required")]
    public required SpaceRole Role { get; init; }
}
