using System.Text.Json.Serialization;

namespace Api.DTOs.Spaces;

/// <summary>
/// Nested object representing a user in space responses.
/// Used for space owner and invitedBy in member responses.
/// </summary>
public sealed class SpaceOwnerInfo
{
    /// <summary>
    /// User unique identifier.
    /// </summary>
    /// <example>550e8400-e29b-41d4-a716-446655440001</example>
    public required Guid Id { get; init; }

    /// <summary>
    /// User display name (FirstName + LastName).
    /// </summary>
    /// <example>John Smith</example>
    public required string DisplayName { get; init; }

    /// <summary>
    /// Avatar image URL.
    /// </summary>
    /// <example>https://example.com/avatar.png</example>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? AvatarUrl { get; init; }
}
