using Api.Common.Errors;
using Api.Exceptions;
using AwesomeAssertions;

namespace Api.Tests.Exceptions;

public class NotFoundExceptionTests
{
    [Fact]
    public void Constructor_Default_ShouldUseDefaultMessage()
    {
        // Act
        var exception = new NotFoundException();

        // Assert
        exception.StatusCode.Should().Be(404);
        exception.ErrorCode.Should().Be(ErrorCodes.RESOURCE_NOT_FOUND);
        exception.Message.Should().Be("Resource not found");
        exception.DisplayType.Should().Be(DisplayType.Page);
    }

    [Fact]
    public void Constructor_WithCustomMessage_ShouldUseIt()
    {
        // Act
        var exception = new NotFoundException("Custom not found message");

        // Assert
        exception.Message.Should().Be("Custom not found message");
    }

    [Fact]
    public void Constructor_WithCustomErrorCode_ShouldUseIt()
    {
        // Act
        var exception = new NotFoundException("Deleted", ErrorCodes.RESOURCE_DELETED);

        // Assert
        exception.ErrorCode.Should().Be(ErrorCodes.RESOURCE_DELETED);
    }

    [Fact]
    public void ForResource_WithoutId_ShouldCreateGenericMessage()
    {
        // Act
        var exception = NotFoundException.ForResource("Note");

        // Assert
        exception.Message.Should().Be("Note not found");
    }

    [Fact]
    public void ForResource_WithId_ShouldIncludeIdInMessage()
    {
        // Arrange
        var id = Guid.NewGuid();

        // Act
        var exception = NotFoundException.ForResource("Note", id);

        // Assert
        exception.Message.Should().Be($"Note with ID '{id}' not found");
    }

    [Fact]
    public void User_WithoutId_ShouldCreateUserNotFound()
    {
        // Act
        var exception = NotFoundException.User();

        // Assert
        exception.Message.Should().Be("User not found");
    }

    [Fact]
    public void User_WithId_ShouldIncludeIdInMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var exception = NotFoundException.User(userId);

        // Assert
        exception.Message.Should().Contain(userId.ToString());
    }

    [Fact]
    public void Organization_WithoutId_ShouldCreateOrgNotFound()
    {
        // Act
        var exception = NotFoundException.Organization();

        // Assert
        exception.Message.Should().Be("Organization not found");
    }

    [Fact]
    public void Organization_WithId_ShouldIncludeIdInMessage()
    {
        // Arrange
        var orgId = Guid.NewGuid();

        // Act
        var exception = NotFoundException.Organization(orgId);

        // Assert
        exception.Message.Should().Contain(orgId.ToString());
    }

    [Fact]
    public void Space_WithoutId_ShouldCreateSpaceNotFound()
    {
        // Act
        var exception = NotFoundException.Space();

        // Assert
        exception.Message.Should().Be("Space not found");
        exception.ErrorCode.Should().Be(ErrorCodes.SPACE_NOT_FOUND);
    }

    [Fact]
    public void Space_WithId_ShouldIncludeIdInMessage()
    {
        // Arrange
        var spaceId = Guid.NewGuid();

        // Act
        var exception = NotFoundException.Space(spaceId);

        // Assert
        exception.Message.Should().Be($"Space with ID '{spaceId}' not found");
        exception.ErrorCode.Should().Be(ErrorCodes.SPACE_NOT_FOUND);
    }

    [Fact]
    public void SpaceMember_ShouldIncludeUserAndSpaceIdsInMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var spaceId = Guid.NewGuid();

        // Act
        var exception = NotFoundException.SpaceMember(userId, spaceId);

        // Assert
        exception.Message.Should().Be($"User with ID '{userId}' is not a member of space '{spaceId}'");
        exception.ErrorCode.Should().Be(ErrorCodes.SPACE_MEMBER_NOT_FOUND);
    }
}
