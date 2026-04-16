using Api.Services;
using AwesomeAssertions;

namespace Api.Tests.Services;

public class PasswordServiceTests
{
    private readonly PasswordService _service = new();

    #region GenerateTemporaryPassword Tests

    [Fact]
    public void GenerateTemporaryPassword_ShouldReturnPasswordOfSpecifiedLength()
    {
        // Act
        var password = _service.GenerateTemporaryPassword(16);

        // Assert
        password.Should().HaveLength(16);
    }

    [Fact]
    public void GenerateTemporaryPassword_ShouldGenerateUniquePasswords()
    {
        // Act
        var password1 = _service.GenerateTemporaryPassword();
        var password2 = _service.GenerateTemporaryPassword();

        // Assert
        password1.Should().NotBe(password2);
    }

    [Theory]
    [InlineData(12)]
    [InlineData(16)]
    [InlineData(32)]
    public void GenerateTemporaryPassword_ShouldRespectLength(int length)
    {
        // Act
        var password = _service.GenerateTemporaryPassword(length);

        // Assert
        password.Should().HaveLength(length);
    }

    [Fact]
    public void GenerateTemporaryPassword_ShouldThrowForShortLength()
    {
        // Act
        var act = () => _service.GenerateTemporaryPassword(11);

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*at least 12 characters*");
    }

    [Fact]
    public void GenerateTemporaryPassword_ShouldContainAtLeastOneLowercaseLetter()
    {
        // Act
        var password = _service.GenerateTemporaryPassword();

        // Assert
        password.Should().MatchRegex("[a-z]");
    }

    [Fact]
    public void GenerateTemporaryPassword_ShouldContainAtLeastOneUppercaseLetter()
    {
        // Act
        var password = _service.GenerateTemporaryPassword();

        // Assert
        password.Should().MatchRegex("[A-Z]");
    }

    [Fact]
    public void GenerateTemporaryPassword_ShouldContainAtLeastOneDigit()
    {
        // Act
        var password = _service.GenerateTemporaryPassword();

        // Assert
        password.Should().MatchRegex("[0-9]");
    }

    [Fact]
    public void GenerateTemporaryPassword_ShouldContainAtLeastOneSpecialCharacter()
    {
        // Act
        var password = _service.GenerateTemporaryPassword();

        // Assert
        password.Should().MatchRegex("[!@#$%^&*]");
    }

    [Fact]
    public void GenerateTemporaryPassword_ShouldMeetAllComplexityRequirements()
    {
        // Run multiple times to ensure consistency
        for (int i = 0; i < 100; i++)
        {
            // Act
            var password = _service.GenerateTemporaryPassword();

            // Assert
            password.Should().HaveLength(16);
            password.Should().MatchRegex("[a-z]", "password should contain lowercase");
            password.Should().MatchRegex("[A-Z]", "password should contain uppercase");
            password.Should().MatchRegex("[0-9]", "password should contain digit");
            password.Should().MatchRegex("[!@#$%^&*]", "password should contain special char");
        }
    }

    #endregion

    #region HashPassword Tests

    [Fact]
    public void HashPassword_ShouldReturnBcryptHash()
    {
        // Act
        var hash = _service.HashPassword("testPassword123");

        // Assert
        hash.Should().StartWith("$2");
        hash.Should().HaveLength(60);
    }

    [Fact]
    public void HashPassword_ShouldUseCostFactor12()
    {
        // Act
        var hash = _service.HashPassword("testPassword123");

        // Assert - BCrypt hash format: $2a$12$... where 12 is the cost factor
        hash.Should().MatchRegex(@"^\$2[aby]?\$12\$");
    }

    [Fact]
    public void HashPassword_ShouldGenerateDifferentHashesForSamePassword()
    {
        // Act
        var hash1 = _service.HashPassword("testPassword");
        var hash2 = _service.HashPassword("testPassword");

        // Assert - Different salts produce different hashes
        hash1.Should().NotBe(hash2);
    }

    #endregion

    #region VerifyPassword Tests

    [Fact]
    public void VerifyPassword_ShouldReturnTrueForCorrectPassword()
    {
        // Arrange
        var password = "testPassword123";
        var hash = _service.HashPassword(password);

        // Act
        var result = _service.VerifyPassword(password, hash);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void VerifyPassword_ShouldReturnFalseForIncorrectPassword()
    {
        // Arrange
        var hash = _service.HashPassword("correctPassword");

        // Act
        var result = _service.VerifyPassword("wrongPassword", hash);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void VerifyPassword_ShouldBeCaseSensitive()
    {
        // Arrange
        var hash = _service.HashPassword("Password123");

        // Act
        var result = _service.VerifyPassword("password123", hash);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void VerifyPassword_ShouldWorkWithGeneratedPassword()
    {
        // Arrange
        var password = _service.GenerateTemporaryPassword();
        var hash = _service.HashPassword(password);

        // Act
        var result = _service.VerifyPassword(password, hash);

        // Assert
        result.Should().BeTrue();
    }

    #endregion
}
