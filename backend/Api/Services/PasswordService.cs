using System.Security.Cryptography;

namespace Api.Services;

/// <summary>
/// Service for password generation and hashing.
/// </summary>
public interface IPasswordService
{
    /// <summary>
    /// Generates a cryptographically secure random password.
    /// </summary>
    /// <param name="length">Length of the password (default 16).</param>
    /// <returns>Random password string.</returns>
    string GenerateTemporaryPassword(int length = 16);

    /// <summary>
    /// Hashes a password using bcrypt.
    /// </summary>
    /// <param name="password">Plain text password.</param>
    /// <returns>Bcrypt hash.</returns>
    string HashPassword(string password);

    /// <summary>
    /// Verifies a password against a hash.
    /// </summary>
    /// <param name="password">Plain text password.</param>
    /// <param name="hash">Bcrypt hash.</param>
    /// <returns>True if password matches.</returns>
    bool VerifyPassword(string password, string hash);
}

/// <summary>
/// Implementation of password service using BCrypt.
/// </summary>
public sealed class PasswordService : IPasswordService
{
    private const int BcryptWorkFactor = 12;
    private const int MinPasswordLength = 12;

    private const string LowercaseChars = "abcdefghijklmnopqrstuvwxyz";
    private const string UppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private const string DigitChars = "0123456789";
    private const string SpecialChars = "!@#$%^&*";
    private const string AllChars = LowercaseChars + UppercaseChars + DigitChars + SpecialChars;

    /// <inheritdoc />
    public string GenerateTemporaryPassword(int length = 16)
    {
        if (length < MinPasswordLength)
            throw new ArgumentException($"Password length must be at least {MinPasswordLength} characters", nameof(length));

        using var rng = RandomNumberGenerator.Create();
        var password = new char[length];

        // Ensure at least one character from each required category
        password[0] = GetRandomChar(rng, LowercaseChars);
        password[1] = GetRandomChar(rng, UppercaseChars);
        password[2] = GetRandomChar(rng, DigitChars);
        password[3] = GetRandomChar(rng, SpecialChars);

        // Fill remaining positions with random characters from all categories
        for (int i = 4; i < length; i++)
        {
            password[i] = GetRandomChar(rng, AllChars);
        }

        // Shuffle the password to randomize positions
        ShuffleArray(rng, password);

        return new string(password);
    }

    private static char GetRandomChar(RandomNumberGenerator rng, string chars)
    {
        var bytes = new byte[1];
        rng.GetBytes(bytes);
        return chars[bytes[0] % chars.Length];
    }

    private static void ShuffleArray(RandomNumberGenerator rng, char[] array)
    {
        var bytes = new byte[1];
        for (int i = array.Length - 1; i > 0; i--)
        {
            rng.GetBytes(bytes);
            int j = bytes[0] % (i + 1);
            (array[i], array[j]) = (array[j], array[i]);
        }
    }

    /// <inheritdoc />
    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, BcryptWorkFactor);
    }

    /// <inheritdoc />
    public bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
