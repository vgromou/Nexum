using System.Text.Json.Serialization;

namespace Api.Common.Errors;

/// <summary>
/// Specifies how the frontend should display the error.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter<DisplayType>))]
public enum DisplayType
{
    /// <summary>
    /// Full-page error display (404, 403, session expired).
    /// </summary>
    Page,

    /// <summary>
    /// Auto-dismiss notification (save failed, network error).
    /// </summary>
    Toast,

    /// <summary>
    /// Show under form fields (validation errors).
    /// </summary>
    Field,

    /// <summary>
    /// Show near action trigger (cannot delete due to dependencies).
    /// </summary>
    Inline,

    /// <summary>
    /// No display needed (client closed request, internal errors not shown to user).
    /// </summary>
    None
}
