namespace Api.DTOs.Spaces;

/// <summary>
/// How a user obtained access to a space.
/// </summary>
public enum AccessSource
{
    /// <summary>Direct space membership.</summary>
    Explicit,

    /// <summary>Organization admin privilege.</summary>
    OrgAdmin,

    /// <summary>Organization manager privilege (read-only access to archived spaces).</summary>
    OrgManager,

    /// <summary>Via the space's default access level.</summary>
    DefaultAccess
}
