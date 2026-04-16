using Api.Common.Errors;
using Api.Exceptions;
using AwesomeAssertions;

namespace Api.Tests.Exceptions;

public class BusinessRuleExceptionTests
{
    [Fact]
    public void SpaceAlreadyArchived_ShouldCreateCorrectException()
    {
        // Act
        var exception = BusinessRuleException.SpaceAlreadyArchived();

        // Assert
        exception.StatusCode.Should().Be(422);
        exception.ErrorCode.Should().Be(ErrorCodes.SPACE_ALREADY_ARCHIVED);
        exception.Message.Should().Be("Space is already archived");
        exception.DisplayType.Should().Be(DisplayType.Inline);
    }

    [Fact]
    public void SpaceNotArchived_ShouldCreateCorrectException()
    {
        // Act
        var exception = BusinessRuleException.SpaceNotArchived();

        // Assert
        exception.StatusCode.Should().Be(422);
        exception.ErrorCode.Should().Be(ErrorCodes.SPACE_NOT_ARCHIVED);
        exception.Message.Should().Be("Space is not archived");
    }

    [Fact]
    public void CannotRemoveLastOwner_ShouldCreateCorrectException()
    {
        // Act
        var exception = BusinessRuleException.CannotRemoveLastOwner();

        // Assert
        exception.StatusCode.Should().Be(422);
        exception.ErrorCode.Should().Be(ErrorCodes.CANNOT_REMOVE_LAST_OWNER);
        exception.Message.Should().Be("Cannot remove the last Owner. Transfer ownership first");
    }

    [Fact]
    public void CannotChangeOwnerRole_ShouldCreateCorrectException()
    {
        // Act
        var exception = BusinessRuleException.CannotChangeOwnerRole();

        // Assert
        exception.StatusCode.Should().Be(422);
        exception.ErrorCode.Should().Be(ErrorCodes.CANNOT_CHANGE_OWNER_ROLE);
        exception.Message.Should().Be("Cannot change Owner's role. Use transfer-ownership endpoint");
    }
}
