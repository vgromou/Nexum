namespace Api.DTOs.Common;

/// <summary>
/// Generic wrapper for paginated list responses.
/// Used across all API endpoints that return lists with pagination.
/// </summary>
/// <typeparam name="T">The type of items in the response.</typeparam>
public sealed class PagedResponse<T>
{
    /// <summary>
    /// List of items for the current page.
    /// </summary>
    public required IReadOnlyList<T> Items { get; init; }

    /// <summary>
    /// Current page number (1-based).
    /// </summary>
    /// <example>1</example>
    public required int Page { get; init; }

    /// <summary>
    /// Number of items per page.
    /// </summary>
    /// <example>20</example>
    public required int PageSize { get; init; }

    /// <summary>
    /// Total number of items across all pages.
    /// </summary>
    /// <example>45</example>
    public required int TotalItems { get; init; }

    /// <summary>
    /// Total number of pages.
    /// </summary>
    /// <example>3</example>
    public int TotalPages => PageSize > 0
        ? (int)Math.Ceiling(TotalItems / (double)PageSize)
        : 0;

    /// <summary>
    /// Whether there is a next page.
    /// </summary>
    /// <example>true</example>
    public bool HasNextPage => Page < TotalPages;

    /// <summary>
    /// Whether there is a previous page.
    /// </summary>
    /// <example>false</example>
    public bool HasPreviousPage => Page > 1;
}

/// <summary>
/// Factory methods for creating PagedResponse instances.
/// </summary>
public static class PagedResponse
{
    /// <summary>
    /// Creates a new PagedResponse with the specified items and pagination metadata.
    /// </summary>
    public static PagedResponse<T> Create<T>(
        IEnumerable<T> items,
        int page,
        int pageSize,
        int totalItems)
    {
        return new PagedResponse<T>
        {
            Items = items.ToList(),
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems
        };
    }
}
