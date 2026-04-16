using System.ComponentModel.DataAnnotations;
using Api.Models;

namespace Api.DTOs.Organizations;

/// <summary>
/// Query parameters for fetching organization members.
/// </summary>
public sealed class GetMembersQueryParameters
{
    /// <summary>
    /// Page number (1-based).
    /// </summary>
    /// <example>1</example>
    [Range(1, int.MaxValue, ErrorMessage = "Page must be greater than 0")]
    public int Page { get; init; } = 1;

    /// <summary>
    /// Number of items per page. Maximum is 100.
    /// </summary>
    /// <example>20</example>
    [Range(1, 100, ErrorMessage = "PageSize must be between 1 and 100")]
    public int PageSize { get; init; } = 20;

    /// <summary>
    /// Search term to filter by email, first name, last name, or username.
    /// Case-insensitive partial match.
    /// </summary>
    /// <example>john</example>
    [MaxLength(100, ErrorMessage = "Search term must not exceed 100 characters")]
    public string? Search { get; init; }

    /// <summary>
    /// Filter by organization role. Valid values: Admin, Manager, User.
    /// </summary>
    /// <example>User</example>
    public OrganizationRole? OrganizationRole { get; init; }

    /// <summary>
    /// Filter by active status.
    /// </summary>
    /// <example>true</example>
    public bool? IsActive { get; init; }

    /// <summary>
    /// Sort field. Valid values: email, firstName, lastName, createdAt.
    /// </summary>
    /// <example>createdAt</example>
    [RegularExpression("^(email|firstName|lastName|createdAt)$", ErrorMessage = "SortBy must be one of: email, firstName, lastName, createdAt")]
    public string SortBy { get; init; } = "createdAt";

    /// <summary>
    /// Sort order. Valid values: asc, desc.
    /// </summary>
    /// <example>desc</example>
    [RegularExpression("^(asc|desc)$", ErrorMessage = "SortOrder must be one of: asc, desc")]
    public string SortOrder { get; init; } = "desc";
}
