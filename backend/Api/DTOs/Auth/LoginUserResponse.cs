using Api.Models;

namespace Api.DTOs.Auth;

/// <summary>
/// User information returned in login response.
/// </summary>
public sealed class LoginUserResponse
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
    /// <example>john.smith</example>
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
    /// User's display name (computed: FirstName + LastName).
    /// </summary>
    /// <example>John Smith</example>
    public string DisplayName => $"{FirstName} {LastName}";

    /// <summary>
    /// User's role in the organization.
    /// </summary>
    /// <example>user</example>
    public required OrganizationRole OrganizationRole { get; init; }

    /// <summary>
    /// User's job position/title.
    /// </summary>
    /// <example>Software Engineer</example>
    public string? Position { get; init; }

    /// <summary>
    /// User's date of birth.
    /// </summary>
    /// <example>1990-05-15</example>
    public DateOnly? DateOfBirth { get; init; }

    /// <summary>
    /// URL to user's avatar image.
    /// </summary>
    /// <example>https://cdn.example.com/avatars/john-smith.jpg</example>
    public string? AvatarUrl { get; init; }

    /// <summary>
    /// Whether the account is active.
    /// </summary>
    /// <example>true</example>
    public required bool IsActive { get; init; }

    /// <summary>
    /// Whether the user must change their password.
    /// </summary>
    /// <example>false</example>
    public required bool MustChangePassword { get; init; }

    /// <summary>
    /// Account creation timestamp.
    /// </summary>
    /// <example>2025-01-15T10:30:00Z</example>
    public required DateTime CreatedAt { get; init; }

    /// <summary>
    /// Last account update timestamp.
    /// </summary>
    /// <example>2025-01-15T10:30:00Z</example>
    public required DateTime UpdatedAt { get; init; }

    /// <summary>
    /// Last successful login timestamp.
    /// </summary>
    /// <example>2025-01-18T08:45:00Z</example>
    public DateTime? LastLoginAt { get; init; }
}
