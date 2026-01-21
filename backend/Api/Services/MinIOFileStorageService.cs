using Api.Configuration;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;

namespace Api.Services;

/// <summary>
/// MinIO implementation of file storage service.
/// Thread-safe singleton service for S3-compatible object storage operations.
/// </summary>
public sealed class MinIOFileStorageService : IFileStorageService
{
    private readonly IMinioClient _minioClient;
    private readonly MinIOSettings _settings;
    private readonly ILogger<MinIOFileStorageService> _logger;

    public MinIOFileStorageService(
        IOptions<MinIOSettings> settings,
        ILogger<MinIOFileStorageService> logger)
    {
        _settings = settings.Value;
        _logger = logger;

        // Initialize MinIO client
        _minioClient = new MinioClient()
            .WithEndpoint(_settings.Endpoint)
            .WithCredentials(_settings.AccessKey, _settings.SecretKey)
            .WithSSL(_settings.UseSSL)
            .WithRegion(_settings.Region)
            .Build();
    }

    /// <inheritdoc />
    public async Task<string> UploadFileAsync(Stream stream, string objectKey, string contentType)
    {
        try
        {
            _logger.LogInformation("Uploading file to MinIO: {ObjectKey}", objectKey);

            var putObjectArgs = new PutObjectArgs()
                .WithBucket(_settings.BucketName)
                .WithObject(objectKey)
                .WithStreamData(stream)
                .WithObjectSize(stream.Length)
                .WithContentType(contentType);

            await _minioClient.PutObjectAsync(putObjectArgs);

            _logger.LogInformation("Successfully uploaded file to MinIO: {ObjectKey}", objectKey);
            return objectKey;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file to MinIO: {ObjectKey}", objectKey);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task DeleteFileAsync(string objectKey)
    {
        try
        {
            _logger.LogInformation("Deleting file from MinIO: {ObjectKey}", objectKey);

            var removeObjectArgs = new RemoveObjectArgs()
                .WithBucket(_settings.BucketName)
                .WithObject(objectKey);

            await _minioClient.RemoveObjectAsync(removeObjectArgs);

            _logger.LogInformation("Successfully deleted file from MinIO: {ObjectKey}", objectKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete file from MinIO: {ObjectKey}", objectKey);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task DeleteFilesAsync(IEnumerable<string> objectKeys)
    {
        var keys = objectKeys.ToList();
        if (!keys.Any())
            return;

        _logger.LogInformation("Deleting {Count} files from MinIO", keys.Count);

        var tasks = keys.Select(DeleteFileAsync);
        await Task.WhenAll(tasks);

        _logger.LogInformation("Successfully deleted {Count} files from MinIO", keys.Count);
    }

    /// <inheritdoc />
    public string GetPublicUrl(string objectKey)
    {
        // Use custom PublicUrl if configured (for CDN or custom domain)
        // Otherwise, construct URL from endpoint
        var baseUrl = !string.IsNullOrWhiteSpace(_settings.PublicUrl)
            ? _settings.PublicUrl.TrimEnd('/')
            : $"{(_settings.UseSSL ? "https" : "http")}://{_settings.Endpoint}";

        return $"{baseUrl}/{_settings.BucketName}/{objectKey}";
    }

    /// <inheritdoc />
    public async Task<bool> FileExistsAsync(string objectKey)
    {
        try
        {
            var statObjectArgs = new StatObjectArgs()
                .WithBucket(_settings.BucketName)
                .WithObject(objectKey);

            await _minioClient.StatObjectAsync(statObjectArgs);
            return true;
        }
        catch (Minio.Exceptions.ObjectNotFoundException)
        {
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if file exists in MinIO: {ObjectKey}", objectKey);
            throw;
        }
    }
}
