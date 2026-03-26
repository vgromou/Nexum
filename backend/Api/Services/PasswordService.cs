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

    /// <summary>
    /// Gets a random character from the given string using rejection sampling to avoid modulo bias.
    /// </summary>
    private static char GetRandomChar(RandomNumberGenerator rng, string chars)
    {
        // Use rejection sampling to avoid modulo bias
        // For a range of size n, we reject values >= (256 / n) * n
        // This ensures each character has exactly the same probability
        int range = chars.Length;
        int maxUnbiased = (256 / range) * range; // Largest multiple of range that fits in a byte

        var bytes = new byte[1];
        int value;
        do
        {
            rng.GetBytes(bytes);
            value = bytes[0];
        } while (value >= maxUnbiased);

        return chars[value % range];
    }

    /// <summary>
    /// Shuffles an array using Fisher-Yates algorithm with unbiased random selection.
    /// </summary>
    private static void ShuffleArray(RandomNumberGenerator rng, char[] array)
    {
        for (int i = array.Length - 1; i > 0; i--)
        {
            int j = GetUnbiasedRandomInt(rng, i + 1);
            (array[i], array[j]) = (array[j], array[i]);
        }
    }

    /// <summary>
    /// Gets an unbiased random integer in the range [0, exclusiveMax) using rejection sampling.
    /// </summary>
    private static int GetUnbiasedRandomInt(RandomNumberGenerator rng, int exclusiveMax)
    {
        if (exclusiveMax <= 0)
            throw new ArgumentOutOfRangeException(nameof(exclusiveMax), "Must be positive");

        if (exclusiveMax == 1)
            return 0;

        // For small ranges, use single byte with rejection sampling
        if (exclusiveMax <= 256)
        {
            int maxUnbiased = (256 / exclusiveMax) * exclusiveMax;
            var bytes = new byte[1];
            int value;
            do
            {
                rng.GetBytes(bytes);
                value = bytes[0];
            } while (value >= maxUnbiased);

            return value % exclusiveMax;
        }

        // For larger ranges, use multiple bytes
        int byteCount = (int)Math.Ceiling(Math.Log2(exclusiveMax) / 8.0);
        var buffer = new byte[byteCount];
        int mask = (1 << (int)Math.Ceiling(Math.Log2(exclusiveMax))) - 1;

        int result;
        do
        {
            rng.GetBytes(buffer);
            result = 0;
            for (int i = 0; i < byteCount; i++)
            {
                result |= buffer[i] << (i * 8);
            }
            result &= mask;
        } while (result >= exclusiveMax);

        return result;
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
