namespace Api.Models;

/// <summary>
/// User role in the organization (organization-level permissions).
/// Stored as VARCHAR(20) in database.
/// Serialized as lowercase strings via JsonStringEnumConverter with CamelCase policy.
/// </summary>
public enum OrganizationRole
{
    Admin,
    Manager,
    User
}
