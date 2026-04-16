using Microsoft.Extensions.Options;
using Api.Configuration;
using Api.Exceptions;

namespace Api.Services;

/// <summary>
/// Service for validating avatar URLs.
/// </summary>
public interface IAvatarUrlValidator
{
    /// <summary>
    /// Validates an avatar URL against configured security constraints.
    /// </summary>
    /// <param name="url">The URL to validate.</param>
    /// <exception cref="BadRequestException">Thrown if the URL is invalid or not allowed.</exception>
    void ValidateAvatarUrl(string? url);
}

/// <summary>
/// Implementation of avatar URL validation with configurable constraints.
/// </summary>
public sealed class AvatarUrlValidator : IAvatarUrlValidator
{
    private readonly SecuritySettings _settings;

    public AvatarUrlValidator(IOptions<SecuritySettings> settings)
    {
        _settings = settings.Value;
    }

    /// <inheritdoc />
    public void ValidateAvatarUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return; // Null/empty is allowed (clearing avatar)
        }

        // Parse the URL
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            throw new BadRequestException(
                "Invalid avatar URL format.",
                "INVALID_AVATAR_URL");
        }

        // Block dangerous URL schemes (javascript:, data:, etc.)
        var dangerousSchemes = new[] { "javascript", "data", "vbscript", "file" };
        if (dangerousSchemes.Contains(uri.Scheme.ToLowerInvariant()))
        {
            throw new BadRequestException(
                $"Avatar URL scheme '{uri.Scheme}' is not allowed.",
                "INVALID_AVATAR_URL_SCHEME");
        }

        // Validate allowed schemes
        if (_settings.AllowedAvatarUrlSchemes.Count > 0)
        {
            var isSchemeAllowed = _settings.AllowedAvatarUrlSchemes
                .Any(s => s.Equals(uri.Scheme, StringComparison.OrdinalIgnoreCase));

            if (!isSchemeAllowed)
            {
                throw new BadRequestException(
                    $"Avatar URL must use one of the allowed schemes: {string.Join(", ", _settings.AllowedAvatarUrlSchemes)}",
                    "INVALID_AVATAR_URL_SCHEME");
            }
        }

        // Validate allowed domains
        if (_settings.AllowedAvatarUrlDomains.Count > 0)
        {
            var isDomainAllowed = _settings.AllowedAvatarUrlDomains
                .Any(d => uri.Host.Equals(d, StringComparison.OrdinalIgnoreCase) ||
                          uri.Host.EndsWith("." + d, StringComparison.OrdinalIgnoreCase));

            if (!isDomainAllowed)
            {
                throw new BadRequestException(
                    $"Avatar URL domain '{uri.Host}' is not allowed. Allowed domains: {string.Join(", ", _settings.AllowedAvatarUrlDomains)}",
                    "INVALID_AVATAR_URL_DOMAIN");
            }
        }
    }
}
