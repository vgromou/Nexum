namespace Api.Models;

/// <summary>
/// Role within a space. Stored as VARCHAR(20) in database.
/// Private is only valid for <see cref="Space.DefaultAccess"/>,
/// not for <see cref="SpaceMember.Role"/> (enforced by DB check constraint).
/// </summary>
public enum SpaceRole
{
    /// <summary>
    /// Full control over the space including deletion and member management
    /// </summary>
    Owner,

    /// <summary>
    /// Can manage space settings and members but cannot delete the space
    /// </summary>
    Administrator,

    /// <summary>
    /// Can create and edit content within the space
    /// </summary>
    Editor,

    /// <summary>
    /// Read-only access to space content
    /// </summary>
    Viewer,

    /// <summary>
    /// Space is not accessible to non-members. Only valid for Space.DefaultAccess.
    /// </summary>
    Private
}
