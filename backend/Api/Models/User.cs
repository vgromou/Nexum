using System.ComponentModel.DataAnnotations;

namespace Api.Models;

/// <summary>
/// User entity for authentication and authorization
/// </summary>
public class User : AuditableEntity
{
    /// <summary>
    /// Organization this user belongs to
    /// </summary>
    public Guid OrganizationId { get; set; }

    /// <summary>
    /// Unique email address
    /// </summary>
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Unique username
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Hashed password (bcrypt with cost 12)
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// User's first name (required)
    /// </summary>
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// User's last name (required)
    /// </summary>
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// User role in the organization
    /// </summary>
    public UserRole Role { get; set; } = UserRole.User;

    /// <summary>
    /// Job position/title
    /// </summary>
    public string? Position { get; set; }

    /// <summary>
    /// Date of birth
    /// </summary>
    public DateOnly? DateOfBirth { get; set; }

    /// <summary>
    /// Avatar image URL
    /// </summary>
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// Whether the account is active (can be deactivated by admin)
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Forces user to change password on next login
    /// </summary>
    public bool MustChangePassword { get; set; } = false;

    /// <summary>
    /// Counter for failed login attempts (triggers lockout at threshold)
    /// </summary>
    public int FailedLoginAttempts { get; set; } = 0;

    /// <summary>
    /// Temporary lockout expiration time (after failed attempts)
    /// </summary>
    public DateTime? LockoutUntil { get; set; }

    /// <summary>
    /// Last password change timestamp
    /// </summary>
    public DateTime? PasswordChangedAt { get; set; }

    // Navigation properties

    /// <summary>
    /// Organization this user belongs to
    /// </summary>
    public Organization Organization { get; set; } = null!;

    /// <summary>
    /// User's active refresh tokens (multiple sessions)
    /// </summary>
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
