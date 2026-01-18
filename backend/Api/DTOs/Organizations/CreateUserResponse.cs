using System.Text.Json.Serialization;
using Api.Models;

namespace Api.DTOs.Organizations;

/// <summary>
/// Response body after successfully creating a user in an organization.
/// </summary>
public sealed class CreateUserResponse
{
    /// <summary>
    /// Created user details.
    /// </summary>
    public required UserInfo User { get; init; }

    /// <summary>
    /// Auto-generated temporary password.
    /// This is shown only once and should be securely shared with the user.
    /// The user will be required to change this password on first login.
    /// </summary>
    /// <example>Yj7&amp;nQ4!wK9@pT3x</example>
    public required string TemporaryPassword { get; init; }

    /// <summary>
    /// Success message with instructions.
    /// </summary>
    /// <example>User created successfully. Please share the temporary password securely.</example>
    public string Message { get; init; } = "User created successfully. Please share the temporary password securely.";
}

/// <summary>
/// User information returned in API responses.
/// </summary>
public sealed class UserInfo
{
    /// <summary>
    /// User's unique identifier.
    /// </summary>
    /// <example>550e8400-e29b-41d4-a716-446655440001</example>
    public required Guid Id { get; init; }

    /// <summary>
    /// Unique identifier of the organization membership.
    /// </summary>
    /// <example>550e8400-e29b-41d4-a716-446655440002</example>
    public required Guid MemberId { get; init; }

    /// <summary>
    /// User's email address.
    /// </summary>
    /// <example>john.doe@company.com</example>
    public required string Email { get; init; }

    /// <summary>
    /// User's username.
    /// </summary>
    /// <example>john.doe</example>
    public required string Username { get; init; }

    /// <summary>
    /// User's first name.
    /// </summary>
    /// <example>John</example>
    public required string FirstName { get; init; }

    /// <summary>
    /// User's last name.
    /// </summary>
    /// <example>Doe</example>
    public required string LastName { get; init; }

    /// <summary>
    /// User's display name (FirstName + LastName).
    /// </summary>
    /// <example>John Doe</example>
    public string DisplayName => $"{FirstName} {LastName}";

    /// <summary>
    /// Member's role in the organization.
    /// </summary>
    /// <example>user</example>
    public required OrganizationRole OrganizationRole { get; init; }

    /// <summary>
    /// User's job position/title.
    /// </summary>
    /// <example>Software Engineer</example>
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
    /// <example>true</example>
    public required bool MustChangePassword { get; init; }
}
