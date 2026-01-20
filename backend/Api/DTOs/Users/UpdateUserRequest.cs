using System.ComponentModel.DataAnnotations;
using Api.Models;

namespace Api.DTOs.Users;

/// <summary>
/// Request body for updating user profile.
/// All fields are optional (PATCH semantics).
/// </summary>
public sealed class UpdateUserRequest
{
    /// <summary>
    /// User's email address.
    /// Must be unique across all users (case-insensitive).
    /// </summary>
    /// <example>john.smith@company.com</example>
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    [StringLength(255, ErrorMessage = "Email must not exceed 255 characters.")]
    public string? Email { get; init; }

    /// <summary>
    /// User's username.
    /// Must be unique across all users (case-insensitive).
    /// </summary>
    /// <example>jsmith</example>
    [StringLength(50, MinimumLength = 2, ErrorMessage = "Username must be between 2 and 50 characters.")]
    [RegularExpression(@"^[a-zA-Z0-9._-]+$", ErrorMessage = "Username can only contain letters, numbers, dots, underscores, and hyphens.")]
    public string? Username { get; init; }

    /// <summary>
    /// User's first name.
    /// </summary>
    /// <example>John</example>
    [StringLength(100, ErrorMessage = "First name must not exceed 100 characters.")]
    public string? FirstName { get; init; }

    /// <summary>
    /// User's last name.
    /// </summary>
    /// <example>Smith</example>
    [StringLength(100, ErrorMessage = "Last name must not exceed 100 characters.")]
    public string? LastName { get; init; }

    /// <summary>
    /// User's job position/title.
    /// </summary>
    /// <example>Lead Developer</example>
    [StringLength(100, ErrorMessage = "Position must not exceed 100 characters.")]
    public string? Position { get; init; }

    /// <summary>
    /// User's date of birth.
    /// </summary>
    /// <example>1990-05-15</example>
    public DateOnly? DateOfBirth { get; init; }

    /// <summary>
    /// URL to user's avatar image.
    /// </summary>
    /// <example>https://storage.example.com/avatars/user.jpg</example>
    [Url(ErrorMessage = "Invalid URL format.")]
    [StringLength(500, ErrorMessage = "Avatar URL must not exceed 500 characters.")]
    public string? AvatarUrl { get; init; }

    /// <summary>
    /// User's role in the organization.
    /// Only admins can change this field. Non-admins' requests will have this field ignored.
    /// </summary>
    /// <example>manager</example>
    public OrganizationRole? OrganizationRole { get; init; }
}
