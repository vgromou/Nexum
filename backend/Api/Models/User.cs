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
    /// Unique email address (original case preserved)
    /// </summary>
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Normalized email for case-insensitive lookups (lowercase)
    /// </summary>
    public string NormalizedEmail { get; set; } = string.Empty;

    /// <summary>
    /// Unique username
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Hashed password (bcrypt or similar)
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// User's first name
    /// </summary>
    public string? FirstName { get; set; }

    /// <summary>
    /// User's last name
    /// </summary>
    public string? LastName { get; set; }

    /// <summary>
    /// User role in the organization
    /// </summary>
    public UserRole Role { get; set; } = UserRole.Member;

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
    public bool MustChangePassword { get; set; } = true;

    /// <summary>
    /// Counter for failed login attempts (triggers lockout at 5)
    /// </summary>
    public int FailedLoginAttempts { get; set; } = 0;

    /// <summary>
    /// Temporary lockout expiration time (15-minute block after 5 failed attempts)
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
