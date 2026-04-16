using Microsoft.AspNetCore.Http;

namespace Api.Services;

/// <summary>
/// Result of avatar upload operation.
/// </summary>
public sealed record AvatarUploadResult(
    string StoragePath,
    string PublicUrl,
    long FileSize
);

/// <summary>
/// Service for avatar-specific operations including validation and image processing.
/// </summary>
public interface IAvatarService
{
    /// <summary>
    /// Uploads and processes a user avatar.
    /// Validates the file, processes it (resize, convert to WebP), and uploads to storage.
    /// </summary>
    /// <param name="userId">User ID for organizing storage.</param>
    /// <param name="file">Uploaded image file.</param>
    /// <returns>Upload result with storage path, public URL, and file size.</returns>
    /// <exception cref="BadHttpRequestException">If file validation fails.</exception>
    Task<AvatarUploadResult> UploadAvatarAsync(Guid userId, IFormFile file);

    /// <summary>
    /// Deletes all avatar files for a user from storage.
    /// </summary>
    /// <param name="userId">User ID.</param>
    /// <param name="currentStoragePath">Current storage path (if any).</param>
    Task DeleteAvatarAsync(Guid userId, string? currentStoragePath);

    /// <summary>
    /// Validates avatar file before processing.
    /// Checks file size, MIME type, extension, and image validity.
    /// </summary>
    /// <param name="file">File to validate.</param>
    /// <exception cref="BadHttpRequestException">If validation fails.</exception>
    void ValidateAvatarFile(IFormFile file);
}
