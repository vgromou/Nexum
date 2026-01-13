namespace Api.Models;

/// <summary>
/// User role in the organization
/// </summary>
public enum UserRole
{
    /// <summary>
    /// Regular user with limited permissions
    /// </summary>
    Member = 0,

    /// <summary>
    /// Administrator with full access
    /// </summary>
    Admin = 1,

    /// <summary>
    /// Super administrator - organization owner
    /// </summary>
    Owner = 2
}
