using Api.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace Api.Services;

/// <summary>
/// Service for avatar upload, processing, and management.
/// Scoped service that handles image validation, processing, and storage operations.
/// </summary>
public sealed class AvatarService : IAvatarService
{
    private readonly IFileStorageService _fileStorageService;
    private readonly FileStorageSettings _settings;
    private readonly ILogger<AvatarService> _logger;

    // Allowed file extensions
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif"
    };

    // Magic bytes for image format detection (first few bytes of file)
    private static readonly Dictionary<string, byte[][]> MagicBytes = new()
    {
        // JPEG: FF D8 FF
        ["image/jpeg"] = new[] { new byte[] { 0xFF, 0xD8, 0xFF } },
        // PNG: 89 50 4E 47
        ["image/png"] = new[] { new byte[] { 0x89, 0x50, 0x4E, 0x47 } },
        // WebP: 52 49 46 46 (RIFF) followed by WEBP at offset 8
        ["image/webp"] = new[] { new byte[] { 0x52, 0x49, 0x46, 0x46 } },
        // GIF: 47 49 46 38
        ["image/gif"] = new[] { new byte[] { 0x47, 0x49, 0x46, 0x38 } }
    };

    public AvatarService(
        IFileStorageService fileStorageService,
        IOptions<FileStorageSettings> settings,
        ILogger<AvatarService> logger)
    {
        _fileStorageService = fileStorageService;
        _settings = settings.Value;
        _logger = logger;
    }

    /// <inheritdoc />
    public void ValidateAvatarFile(IFormFile file)
    {
        // Check if file is empty
        if (file.Length == 0)
        {
            throw new BadHttpRequestException("Uploaded file is empty");
        }

        // Check file size
        var maxSizeBytes = _settings.MaxFileSizeMB * 1024 * 1024;
        if (file.Length > maxSizeBytes)
        {
            throw new BadHttpRequestException($"File size exceeds {_settings.MaxFileSizeMB}MB limit");
        }

        // Check MIME type
        if (!_settings.AllowedMimeTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
        {
            throw new BadHttpRequestException("Only JPEG, PNG, WebP, and GIF images are allowed");
        }

        // Check file extension
        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
        {
            throw new BadHttpRequestException("Invalid file extension");
        }

        // Verify magic bytes (file signature)
        ValidateMagicBytes(file);
    }

    /// <summary>
    /// Validates file magic bytes to ensure file type matches MIME type.
    /// </summary>
    private void ValidateMagicBytes(IFormFile file)
    {
        using var stream = file.OpenReadStream();
        var buffer = new byte[12]; // Read first 12 bytes for all formats
        var bytesRead = stream.Read(buffer, 0, buffer.Length);

        if (bytesRead < 4)
        {
            throw new BadHttpRequestException("File does not appear to be a valid image");
        }

        // Check if magic bytes match the declared MIME type
        if (MagicBytes.TryGetValue(file.ContentType.ToLowerInvariant(), out var signatures))
        {
            var isValid = signatures.Any(signature =>
                buffer.Take(signature.Length).SequenceEqual(signature));

            if (!isValid)
            {
                throw new BadHttpRequestException("File does not appear to be a valid image");
            }
        }
    }

    /// <inheritdoc />
    public async Task<AvatarUploadResult> UploadAvatarAsync(Guid userId, IFormFile file)
    {
        // Validate file
        ValidateAvatarFile(file);

        _logger.LogInformation("Processing avatar upload for user {UserId}", userId);

        try
        {
            using var sourceStream = file.OpenReadStream();
            using var image = await Image.LoadAsync(sourceStream);

            // Verify minimum size
            if (image.Width < 32 || image.Height < 32)
            {
                throw new BadHttpRequestException("Image must be at least 32x32 pixels");
            }

            // Strip EXIF metadata for privacy and security
            image.Metadata.ExifProfile = null;
            image.Metadata.IptcProfile = null;
            image.Metadata.XmpProfile = null;

            // Generate storage keys
            var basePath = $"avatars/{userId}";
            var smallKey = $"{basePath}/128.webp";
            var largeKey = $"{basePath}/256.webp";

            // Process and upload small thumbnail (128x128)
            await ProcessAndUploadThumbnail(
                image,
                smallKey,
                _settings.ThumbnailSmallSize,
                _settings.WebPQuality);

            // Process and upload large thumbnail (256x256)
            await ProcessAndUploadThumbnail(
                image,
                largeKey,
                _settings.ThumbnailLargeSize,
                _settings.WebPQuality);

            // Calculate total file size (approximate, both WebP files)
            var publicUrl = _fileStorageService.GetPublicUrl(largeKey);

            _logger.LogInformation(
                "Successfully processed and uploaded avatar for user {UserId}",
                userId);

            // Return the large thumbnail as the primary avatar
            // Storage path points to the base path for easier cleanup
            return new AvatarUploadResult(
                StoragePath: basePath,
                PublicUrl: publicUrl,
                FileSize: file.Length);
        }
        catch (UnknownImageFormatException ex)
        {
            _logger.LogWarning(ex, "Invalid image format for user {UserId}", userId);
            throw new BadHttpRequestException("Unsupported or corrupt image file");
        }
        catch (InvalidImageContentException ex)
        {
            _logger.LogWarning(ex, "Invalid image content for user {UserId}", userId);
            throw new BadHttpRequestException("Unsupported or corrupt image file");
        }
        catch (BadHttpRequestException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process avatar for user {UserId}", userId);
            throw new Exception("Failed to process image", ex);
        }
    }

    /// <summary>
    /// Processes an image to create a thumbnail and uploads it to storage.
    /// </summary>
    private async Task ProcessAndUploadThumbnail(
        Image image,
        string objectKey,
        int size,
        int quality)
    {
        using var processedImage = image.Clone(ctx =>
        {
            // Resize to square thumbnail (crop to center if not square)
            var resizeOptions = new ResizeOptions
            {
                Size = new Size(size, size),
                Mode = ResizeMode.Crop,
                Position = AnchorPositionMode.Center
            };
            ctx.Resize(resizeOptions);
        });

        // Convert to WebP and upload
        using var outputStream = new MemoryStream();
        var encoder = new WebpEncoder
        {
            Quality = quality,
            FileFormat = WebpFileFormatType.Lossy
        };

        await processedImage.SaveAsync(outputStream, encoder);
        outputStream.Position = 0;

        await _fileStorageService.UploadFileAsync(
            outputStream,
            objectKey,
            "image/webp");
    }

    /// <inheritdoc />
    public async Task DeleteAvatarAsync(Guid userId, string? currentStoragePath)
    {
        if (string.IsNullOrWhiteSpace(currentStoragePath))
            return;

        _logger.LogInformation("Deleting avatar for user {UserId}", userId);

        try
        {
            // Delete both thumbnail sizes
            var keys = new[]
            {
                $"{currentStoragePath}/128.webp",
                $"{currentStoragePath}/256.webp"
            };

            await _fileStorageService.DeleteFilesAsync(keys);

            _logger.LogInformation("Successfully deleted avatar for user {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete avatar for user {UserId}", userId);
            // Don't throw - we still want to update the database even if file deletion fails
        }
    }
}
