using System.ComponentModel.DataAnnotations;

namespace Api.DTOs.Spaces;

/// <summary>
/// Request body for transferring space ownership.
/// </summary>
public sealed class TransferOwnershipRequest
{
    /// <summary>
    /// User to become the new owner. Must be an existing space member with Administrator role.
    /// </summary>
    /// <example>550e8400-e29b-41d4-a716-446655440002</example>
    [Required(ErrorMessage = "NewOwnerId is required")]
    public required Guid NewOwnerId { get; init; }
}
