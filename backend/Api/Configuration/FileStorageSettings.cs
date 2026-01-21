using System.ComponentModel.DataAnnotations;

namespace Api.Configuration;

/// <summary>
/// Configuration settings for file storage and image processing.
/// </summary>
public sealed class FileStorageSettings
{
    /// <summary>
    /// Configuration section name.
    /// </summary>
    public const string SectionName = "FileStorage";

    /// <summary>
    /// Maximum file size in megabytes.
    /// </summary>
    [Range(1, 100)]
    public int MaxFileSizeMB { get; init; } = 5;

    /// <summary>
    /// Allowed MIME types for uploaded files.
    /// </summary>
    [Required]
    [MinLength(1)]
    public required string[] AllowedMimeTypes { get; init; }

    /// <summary>
    /// Small thumbnail size in pixels (square).
    /// </summary>
    [Range(32, 512)]
    public int ThumbnailSmallSize { get; init; } = 128;

    /// <summary>
    /// Large thumbnail size in pixels (square).
    /// </summary>
    [Range(64, 1024)]
    public int ThumbnailLargeSize { get; init; } = 256;

    /// <summary>
    /// WebP image quality (0-100).
    /// </summary>
    [Range(1, 100)]
    public int WebPQuality { get; init; } = 85;
}
