namespace Api.Services;

/// <summary>
/// Service for file storage operations using S3-compatible storage.
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// Uploads a file to storage.
    /// </summary>
    /// <param name="stream">File stream to upload.</param>
    /// <param name="objectKey">S3 object key/path (e.g., "avatars/user-id/128.webp").</param>
    /// <param name="contentType">MIME type of the file.</param>
    /// <returns>Storage path of the uploaded file.</returns>
    Task<string> UploadFileAsync(Stream stream, string objectKey, string contentType);

    /// <summary>
    /// Deletes a file from storage.
    /// </summary>
    /// <param name="objectKey">S3 object key/path to delete.</param>
    Task DeleteFileAsync(string objectKey);

    /// <summary>
    /// Deletes multiple files from storage.
    /// </summary>
    /// <param name="objectKeys">Collection of S3 object keys/paths to delete.</param>
    Task DeleteFilesAsync(IEnumerable<string> objectKeys);

    /// <summary>
    /// Gets the public URL for a stored file.
    /// </summary>
    /// <param name="objectKey">S3 object key/path.</param>
    /// <returns>Public URL to access the file.</returns>
    string GetPublicUrl(string objectKey);

    /// <summary>
    /// Checks if a file exists in storage.
    /// </summary>
    /// <param name="objectKey">S3 object key/path to check.</param>
    /// <returns>True if file exists, false otherwise.</returns>
    Task<bool> FileExistsAsync(string objectKey);
}
