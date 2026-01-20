using Api.DTOs.Organizations;
using Api.Models;

namespace Api.Extensions;

/// <summary>
/// Extension methods for User entity mapping.
/// </summary>
public static class UserExtensions
{
    /// <summary>
    /// Maps a User entity to UserInfo DTO.
    /// </summary>
    /// <param name="user">The user entity.</param>
    /// <param name="membership">Optional organization membership for role and member ID.</param>
    /// <returns>UserInfo DTO.</returns>
    public static UserInfo ToUserInfo(this User user, OrganizationMember? membership = null)
    {
        return new UserInfo
        {
            Id = user.Id,
            MemberId = membership?.Id,
            Email = user.Email,
            Username = user.Username,
            FirstName = user.FirstName,
            LastName = user.LastName,
            OrganizationRole = membership?.OrganizationRole ?? OrganizationRole.User,
            Position = user.Position,
            DateOfBirth = user.DateOfBirth,
            AvatarUrl = user.AvatarUrl,
            IsActive = user.IsActive,
            MustChangePassword = user.MustChangePassword,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            LastLoginAt = user.LastLoginAt
        };
    }
}
