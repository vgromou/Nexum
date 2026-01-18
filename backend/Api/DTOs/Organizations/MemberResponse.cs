using System.Text.Json.Serialization;
using Api.Models;

namespace Api.DTOs.Organizations;

/// <summary>
/// Response body for member operations.
/// </summary>
public sealed class MemberResponse
{
    /// <summary>
    /// User's unique identifier.
    /// </summary>
    /// <example>550e8400-e29b-41d4-a716-446655440000</example>
    public required Guid Id { get; init; }

    /// <summary>
    /// User's email address.
    /// </summary>
    /// <example>john.smith@company.com</example>
    public required string Email { get; init; }

    /// <summary>
    /// User's username.
    /// </summary>
    /// <example>jsmith</example>
    public required string Username { get; init; }

    /// <summary>
    /// User's first name.
    /// </summary>
    /// <example>John</example>
    public required string FirstName { get; init; }

    /// <summary>
    /// User's last name.
    /// </summary>
    /// <example>Smith</example>
    public required string LastName { get; init; }

    /// <summary>
    /// User's display name (FirstName + LastName).
    /// </summary>
    /// <example>John Smith</example>
    public string DisplayName => $"{FirstName} {LastName}";

    /// <summary>
    /// Member's role in the organization.
    /// </summary>
    /// <example>Admin</example>
    public required OrganizationRole OrganizationRole { get; init; }

    /// <summary>
    /// User's job position/title.
    /// </summary>
    /// <example>Lead Developer</example>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Position { get; init; }

    /// <summary>
    /// User's date of birth.
    /// </summary>
    /// <example>1990-05-15</example>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public DateOnly? DateOfBirth { get; init; }

    /// <summary>
    /// User's avatar image URL.
    /// </summary>
    /// <example>https://example.com/avatars/john.jpg</example>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? AvatarUrl { get; init; }

    /// <summary>
    /// Whether the user account is active.
    /// </summary>
    /// <example>true</example>
    public required bool IsActive { get; init; }

    /// <summary>
    /// Whether the user must change their password on next login.
    /// </summary>
    /// <example>false</example>
    public required bool MustChangePassword { get; init; }

    /// <summary>
    /// When the user account was created.
    /// </summary>
    /// <example>2024-01-10T08:00:00Z</example>
    public required DateTime CreatedAt { get; init; }

    /// <summary>
    /// When the user account was last updated.
    /// </summary>
    /// <example>2024-01-15T10:30:00Z</example>
    public required DateTime UpdatedAt { get; init; }

    /// <summary>
    /// When the user last logged in.
    /// </summary>
    /// <example>2024-01-15T10:30:00Z</example>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public DateTime? LastLoginAt { get; init; }
}
