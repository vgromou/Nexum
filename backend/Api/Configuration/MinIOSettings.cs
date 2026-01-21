using System.ComponentModel.DataAnnotations;

namespace Api.Configuration;

/// <summary>
/// Configuration settings for MinIO object storage.
/// </summary>
public sealed class MinIOSettings
{
    /// <summary>
    /// Configuration section name.
    /// </summary>
    public const string SectionName = "MinIO";

    /// <summary>
    /// MinIO server endpoint (e.g., "localhost:9000").
    /// </summary>
    [Required]
    public required string Endpoint { get; init; }

    /// <summary>
    /// MinIO access key.
    /// </summary>
    [Required]
    public required string AccessKey { get; init; }

    /// <summary>
    /// MinIO secret key.
    /// </summary>
    [Required]
    public required string SecretKey { get; init; }

    /// <summary>
    /// S3 bucket name for file storage.
    /// </summary>
    [Required]
    public required string BucketName { get; init; }

    /// <summary>
    /// Whether to use SSL/TLS for connections.
    /// </summary>
    public bool UseSSL { get; init; } = false;

    /// <summary>
    /// AWS region (default: us-east-1).
    /// </summary>
    public string Region { get; init; } = "us-east-1";

    /// <summary>
    /// Optional public URL for CDN or custom domain (if different from endpoint).
    /// If not set, will use the endpoint for public URLs.
    /// </summary>
    public string? PublicUrl { get; init; }
}
