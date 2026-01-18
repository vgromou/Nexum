using System.Text.Json.Serialization;

namespace Api.DTOs.Organizations;

/// <summary>
/// Response body for organization operations.
/// </summary>
public sealed class OrganizationResponse
{
    /// <summary>
    /// Unique identifier of the organization.
    /// </summary>
    /// <example>550e8400-e29b-41d4-a716-446655440000</example>
    public required Guid Id { get; init; }

    /// <summary>
    /// Organization display name.
    /// </summary>
    /// <example>Acme Corporation</example>
    public required string Name { get; init; }

    /// <summary>
    /// Unique URL-friendly identifier.
    /// </summary>
    /// <example>acme-corp</example>
    public required string Slug { get; init; }

    /// <summary>
    /// Organization logo URL.
    /// </summary>
    /// <example>https://example.com/logo.png</example>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? LogoUrl { get; init; }

    /// <summary>
    /// When the organization was created.
    /// </summary>
    /// <example>2024-01-15T10:30:00Z</example>
    public required DateTime CreatedAt { get; init; }

    /// <summary>
    /// When the organization was last updated.
    /// </summary>
    /// <example>2024-01-15T10:30:00Z</example>
    public required DateTime UpdatedAt { get; init; }
}
