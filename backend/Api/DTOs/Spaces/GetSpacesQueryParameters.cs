using System.ComponentModel.DataAnnotations;

namespace Api.DTOs.Spaces;

/// <summary>
/// Query parameters for listing spaces.
/// </summary>
public sealed class GetSpacesQueryParameters
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
    /// Search by space name (case-insensitive, partial match).
    /// </summary>
    /// <example>engineering</example>
    [MaxLength(200, ErrorMessage = "Search term must not exceed 200 characters")]
    public string? Search { get; init; }

    /// <summary>
    /// Filter by owner display name (partial match).
    /// </summary>
    /// <example>John</example>
    [MaxLength(200, ErrorMessage = "Owner filter must not exceed 200 characters")]
    public string? Owner { get; init; }

    /// <summary>
    /// Include archived spaces.
    /// </summary>
    /// <example>false</example>
    public bool IsArchived { get; init; } = false;
}
