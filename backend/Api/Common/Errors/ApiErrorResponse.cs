using System.Text.Json.Serialization;

namespace Api.Common.Errors;

/// <summary>
/// Wrapper for API error responses.
/// All error responses are wrapped in { "error": ... } structure.
/// </summary>
public sealed class ApiErrorResponse
{
    /// <summary>
    /// The error object containing all error details.
    /// </summary>
    [JsonPropertyName("error")]
    public required ApiError Error { get; init; }

    /// <summary>
    /// Creates an ApiErrorResponse from an ApiError.
    /// </summary>
    public static ApiErrorResponse FromError(ApiError error) => new() { Error = error };
}
