using System.ComponentModel.DataAnnotations;
using Api.Models;

namespace Api.DTOs.Organizations;

/// <summary>
/// Request body for creating a new user in an organization.
/// </summary>
public sealed class CreateUserRequest
{
    /// <summary>
    /// User's email address. Must be globally unique.
    /// </summary>
    /// <example>john.doe@company.com</example>
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [MaxLength(255, ErrorMessage = "Email must not exceed 255 characters")]
    public required string Email { get; init; }

    /// <summary>
    /// User's username. Must be globally unique.
    /// If not provided, will be auto-generated from email (part before @).
    /// </summary>
    /// <example>john.doe</example>
    [MaxLength(100, ErrorMessage = "Username must not exceed 100 characters")]
    [RegularExpression(@"^[a-zA-Z0-9._-]+$", ErrorMessage = "Username can only contain letters, numbers, dots, underscores and hyphens.")]
    public string? Username { get; init; }

    /// <summary>
    /// User's first name.
    /// </summary>
    /// <example>John</example>
    [Required(ErrorMessage = "First name is required")]
    [MaxLength(100, ErrorMessage = "First name must not exceed 100 characters")]
    public required string FirstName { get; init; }

    /// <summary>
    /// User's last name.
    /// </summary>
    /// <example>Doe</example>
    [Required(ErrorMessage = "Last name is required")]
    [MaxLength(100, ErrorMessage = "Last name must not exceed 100 characters")]
    public required string LastName { get; init; }

    /// <summary>
    /// Member's role in the organization. Valid values: admin, manager, user.
    /// Defaults to 'user' if not specified.
    /// </summary>
    /// <example>user</example>
    public OrganizationRole OrganizationRole { get; init; } = OrganizationRole.User;

    /// <summary>
    /// User's job position/title.
    /// </summary>
    /// <example>Software Engineer</example>
    [MaxLength(200, ErrorMessage = "Position must not exceed 200 characters")]
    public string? Position { get; init; }

    /// <summary>
    /// User's date of birth.
    /// </summary>
    /// <example>1990-05-15</example>
    public DateOnly? DateOfBirth { get; init; }
}
