using Api.Common.Errors;
using Api.Exceptions;
using AwesomeAssertions;

namespace Api.Tests.Exceptions;

public class ConflictExceptionTests
{
    [Fact]
    public void Constructor_Default_ShouldUseDefaultValues()
    {
        // Act
        var exception = new ConflictException();

        // Assert
        exception.StatusCode.Should().Be(409);
        exception.ErrorCode.Should().Be(ErrorCodes.CONFLICT_CONCURRENT_EDIT);
        exception.Message.Should().Be("A conflict occurred");
        exception.DisplayType.Should().Be(DisplayType.Toast);
    }

    [Fact]
    public void Constructor_WithCustomMessage_ShouldUseIt()
    {
        // Act
        var exception = new ConflictException("Custom conflict message");

        // Assert
        exception.Message.Should().Be("Custom conflict message");
    }

    [Fact]
    public void Constructor_WithCustomErrorCode_ShouldUseIt()
    {
        // Act
        var exception = new ConflictException("Message", ErrorCodes.CONFLICT_DUPLICATE_ENTRY);

        // Assert
        exception.ErrorCode.Should().Be(ErrorCodes.CONFLICT_DUPLICATE_ENTRY);
    }

    [Fact]
    public void ConcurrentEdit_WithoutResourceType_ShouldCreateGenericMessage()
    {
        // Act
        var exception = ConflictException.ConcurrentEdit();

        // Assert
        exception.Message.Should().Be("This resource has been modified by another user. Please refresh and try again");
        exception.ErrorCode.Should().Be(ErrorCodes.CONFLICT_CONCURRENT_EDIT);
    }

    [Fact]
    public void ConcurrentEdit_WithResourceType_ShouldIncludeInMessage()
    {
        // Act
        var exception = ConflictException.ConcurrentEdit("Note");

        // Assert
        exception.Message.Should().Be("The note has been modified by another user. Please refresh and try again");
    }

    [Fact]
    public void VersionMismatch_ShouldCreateCorrectException()
    {
        // Act
        var exception = ConflictException.VersionMismatch();

        // Assert
        exception.Message.Should().Be("The data has changed since you last loaded it. Please refresh and try again");
        exception.ErrorCode.Should().Be(ErrorCodes.CONFLICT_VERSION_MISMATCH);
    }

    [Fact]
    public void DuplicateEntry_WithoutValue_ShouldCreateGenericMessage()
    {
        // Act
        var exception = ConflictException.DuplicateEntry("email");

        // Assert
        exception.Message.Should().Be("A record with this email already exists");
        exception.ErrorCode.Should().Be(ErrorCodes.CONFLICT_DUPLICATE_ENTRY);
    }

    [Fact]
    public void DuplicateEntry_WithValue_ShouldIncludeValueInMessage()
    {
        // Act
        var exception = ConflictException.DuplicateEntry("email", "test@example.com");

        // Assert
        exception.Message.Should().Be("A record with email 'test@example.com' already exists");
    }

    [Fact]
    public void AlreadyExists_ShouldCreateCorrectException()
    {
        // Act
        var exception = ConflictException.AlreadyExists("User");

        // Assert
        exception.Message.Should().Be("User already exists");
        exception.ErrorCode.Should().Be(ErrorCodes.RESOURCE_ALREADY_EXISTS);
    }

    [Fact]
    public void EmailExists_ShouldCreateCorrectException()
    {
        // Arrange
        var email = "john@example.com";

        // Act
        var exception = ConflictException.EmailExists(email);

        // Assert
        exception.StatusCode.Should().Be(409);
        exception.ErrorCode.Should().Be(ErrorCodes.CONFLICT_EMAIL_EXISTS);
        exception.Message.Should().Be($"A user with email '{email}' already exists");
        exception.DisplayType.Should().Be(DisplayType.Toast);
    }

    [Fact]
    public void UsernameExists_ShouldCreateCorrectException()
    {
        // Arrange
        var username = "johndoe";

        // Act
        var exception = ConflictException.UsernameExists(username);

        // Assert
        exception.StatusCode.Should().Be(409);
        exception.ErrorCode.Should().Be(ErrorCodes.CONFLICT_USERNAME_EXISTS);
        exception.Message.Should().Be($"A user with username '{username}' already exists");
        exception.DisplayType.Should().Be(DisplayType.Toast);
    }

    [Fact]
    public void SpaceSlugExists_ShouldCreateCorrectException()
    {
        // Arrange
        var slug = "engineering";

        // Act
        var exception = ConflictException.SpaceSlugExists(slug);

        // Assert
        exception.StatusCode.Should().Be(409);
        exception.ErrorCode.Should().Be(ErrorCodes.SPACE_SLUG_EXISTS);
        exception.Message.Should().Be($"A space with slug '{slug}' already exists in this organization");
        exception.DisplayType.Should().Be(DisplayType.Toast);
    }

    [Fact]
    public void SpaceMemberExists_ShouldIncludeUserIdInMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var exception = ConflictException.SpaceMemberExists(userId);

        // Assert
        exception.StatusCode.Should().Be(409);
        exception.ErrorCode.Should().Be(ErrorCodes.SPACE_MEMBER_EXISTS);
        exception.Message.Should().Be($"User with ID '{userId}' is already a member of this space");
        exception.DisplayType.Should().Be(DisplayType.Toast);
    }

    [Fact]
    public void ToApiError_ShouldConvertCorrectly()
    {
        // Arrange
        var exception = ConflictException.EmailExists("test@test.com");
        var timestamp = new DateTime(2025, 1, 15, 12, 0, 0, DateTimeKind.Utc);
        var traceId = "test-trace-id";

        // Act
        var error = exception.ToApiError(traceId, timestamp);

        // Assert
        error.Status.Should().Be(409);
        error.Code.Should().Be(ErrorCodes.CONFLICT_EMAIL_EXISTS);
        error.Message.Should().Contain("test@test.com");
        error.DisplayType.Should().Be(DisplayType.Toast);
        error.Timestamp.Should().Be(timestamp);
        error.TraceId.Should().Be(traceId);
    }
}
