using System.ComponentModel.DataAnnotations;

namespace Api.DTOs.Organizations;

/// <summary>
/// Request body for creating a new organization.
/// </summary>
public sealed class CreateOrganizationRequest
{
    /// <summary>
    /// Organization display name.
    /// </summary>
    /// <example>Acme Corporation</example>
    [Required(ErrorMessage = "Name is required")]
    [MinLength(2, ErrorMessage = "Name must be at least 2 characters")]
    [MaxLength(200, ErrorMessage = "Name must not exceed 200 characters")]
    public required string Name { get; init; }

    /// <summary>
    /// Unique URL-friendly identifier. If not provided, will be auto-generated from name.
    /// Must start with a letter and contain only lowercase letters, numbers, and hyphens.
    /// </summary>
    /// <example>acme-corp</example>
    [RegularExpression(@"^[a-z][a-z0-9-]*$", ErrorMessage = "Slug must start with a letter and contain only lowercase letters, numbers, and hyphens")]
    [MinLength(2, ErrorMessage = "Slug must be at least 2 characters")]
    [MaxLength(200, ErrorMessage = "Slug must not exceed 200 characters")]
    public string? Slug { get; init; }

    /// <summary>
    /// Organization logo URL.
    /// </summary>
    /// <example>https://example.com/logo.png</example>
    [MaxLength(500, ErrorMessage = "Logo URL must not exceed 500 characters")]
    [Url(ErrorMessage = "Logo URL must be a valid URL")]
    public string? LogoUrl { get; init; }
}
