using System.Text.Json.Serialization;
using Api.Models;

namespace Api.DTOs.Spaces;

/// <summary>
/// Response DTO for space member operations.
/// </summary>
public sealed class SpaceMemberResponse
{
    /// <summary>
    /// SpaceMember record unique identifier.
    /// </summary>
    /// <example>550e8400-e29b-41d4-a716-446655440010</example>
    public required Guid Id { get; init; }

    /// <summary>
    /// User unique identifier.
    /// </summary>
    /// <example>550e8400-e29b-41d4-a716-446655440001</example>
    public required Guid UserId { get; init; }

    /// <summary>
    /// User display name (FirstName + LastName).
    /// </summary>
    /// <example>John Smith</example>
    public required string DisplayName { get; init; }

    /// <summary>
    /// User email address.
    /// </summary>
    /// <example>john@company.com</example>
    public required string Email { get; init; }

    /// <summary>
    /// User avatar URL.
    /// </summary>
    /// <example>https://example.com/avatar.png</example>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? AvatarUrl { get; init; }

    /// <summary>
    /// Member role in the space.
    /// </summary>
    /// <example>Editor</example>
    public required SpaceRole Role { get; init; }

    /// <summary>
    /// When the user joined the space.
    /// </summary>
    /// <example>2026-01-15T10:30:00Z</example>
    public required DateTime JoinedAt { get; init; }

    /// <summary>
    /// Who invited the member (id, displayName, avatarUrl).
    /// </summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public SpaceOwnerInfo? InvitedBy { get; init; }
}
