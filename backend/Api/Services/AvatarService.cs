using Api.Configuration;
using ImageMagick;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

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

        // Special validation for WebP format
        if (file.ContentType.Equals("image/webp", StringComparison.OrdinalIgnoreCase))
        {
            if (!IsValidWebP(buffer, bytesRead))
            {
                throw new BadHttpRequestException("File does not appear to be a valid image");
            }
            return;
        }

        // Check if magic bytes match the declared MIME type for other formats
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

    /// <summary>
    /// Validates WebP file signature by checking both RIFF header and WEBP marker.
    /// WebP files start with "RIFF" (bytes 0-3) and have "WEBP" at offset 8.
    /// </summary>
    private static bool IsValidWebP(byte[] buffer, int bytesRead)
    {
        // Need at least 12 bytes for full WebP signature
        if (bytesRead < 12)
            return false;

        // Check RIFF header at offset 0
        if (buffer[0] != 0x52 || buffer[1] != 0x49 || buffer[2] != 0x46 || buffer[3] != 0x46)
            return false;

        // Check WEBP signature at offset 8
        return buffer[8] == 0x57 && buffer[9] == 0x45 && buffer[10] == 0x42 && buffer[11] == 0x50;
    }

    /// <inheritdoc />
    public async Task<AvatarUploadResult> UploadAvatarAsync(Guid userId, IFormFile file)
    {
        // Validate file
        ValidateAvatarFile(file);

        _logger.LogInformation("Processing avatar upload for user {UserId}", userId);

        try
        {
            await using var sourceStream = file.OpenReadStream();
            using var image = new MagickImage(sourceStream);

            // Verify minimum size
            if (image.Width < 32 || image.Height < 32)
            {
                throw new BadHttpRequestException("Image must be at least 32x32 pixels");
            }

            // Strip all metadata profiles (EXIF, IPTC, XMP, etc.) for privacy and security
            image.Strip();

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
        catch (MagickException ex)
        {
            _logger.LogWarning(ex, "Invalid or corrupt image for user {UserId}", userId);
            throw new BadHttpRequestException("Unsupported or corrupt image file");
        }
        catch (BadHttpRequestException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process avatar for user {UserId}", userId);
            throw new BadHttpRequestException("Failed to process image. Please ensure the file is a valid image.", ex);
        }
    }

    /// <summary>
    /// Processes an image to create a thumbnail and uploads it to storage.
    /// Produces a square thumbnail by resizing to fill and center-cropping.
    /// </summary>
    private async Task ProcessAndUploadThumbnail(
        IMagickImage<byte> image,
        string objectKey,
        int size,
        int quality)
    {
        using var processedImage = (MagickImage)image.Clone();
        var sizeU = (uint)size;

        // Resize to fill target area, preserving aspect ratio
        processedImage.Resize(new MagickGeometry(sizeU, sizeU) { FillArea = true });

        // Center-crop to exact square and reset virtual canvas
        processedImage.Crop(sizeU, sizeU, Gravity.Center);
        processedImage.ResetPage();

        processedImage.Format = MagickFormat.WebP;
        processedImage.Quality = (uint)quality;
        processedImage.Settings.SetDefine(MagickFormat.WebP, "lossless", false);

        using var outputStream = new MemoryStream();
        await processedImage.WriteAsync(outputStream, MagickFormat.WebP);
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
