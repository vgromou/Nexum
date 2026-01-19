namespace Api.Common.Constants;

/// <summary>
/// Constants for refresh token revocation reasons.
/// </summary>
public static class RevokedReasons
{
    /// <summary>
    /// Token was revoked due to normal token rotation during refresh.
    /// </summary>
    public const string Refresh = "refresh";

    /// <summary>
    /// Token was revoked due to user logout.
    /// </summary>
    public const string Logout = "logout";

    /// <summary>
    /// Token was revoked because an already-revoked token was reused (potential attack).
    /// All tokens in the family are revoked as a security measure.
    /// </summary>
    public const string TokenReuse = "token_reuse";

    /// <summary>
    /// Token was revoked as part of a security measure (e.g., family revocation after reuse detection).
    /// </summary>
    public const string SecurityRevocation = "security_revocation";
}
