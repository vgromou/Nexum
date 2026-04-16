using Api.Models;
using AwesomeAssertions;

namespace Api.Tests.Models;

public class OrganizationMemberTests
{
    [Fact]
    public void OrganizationMember_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var member = new OrganizationMember();

        // Assert
        member.OrganizationId.Should().Be(Guid.Empty);
        member.UserId.Should().Be(Guid.Empty);
        member.OrganizationRole.Should().Be(OrganizationRole.User);
        member.JoinedAt.Should().Be(default);
    }

    [Fact]
    public void OrganizationMember_ShouldSetProperties()
    {
        // Arrange
        var orgId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var joinedAt = DateTime.UtcNow;

        // Act
        var member = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            UserId = userId,
            OrganizationRole = OrganizationRole.Admin,
            JoinedAt = joinedAt
        };

        // Assert
        member.OrganizationId.Should().Be(orgId);
        member.UserId.Should().Be(userId);
        member.OrganizationRole.Should().Be(OrganizationRole.Admin);
        member.JoinedAt.Should().Be(joinedAt);
    }

    [Theory]
    [InlineData(OrganizationRole.User)]
    [InlineData(OrganizationRole.Manager)]
    [InlineData(OrganizationRole.Admin)]
    public void OrganizationMember_ShouldAcceptAllRoleValues(OrganizationRole role)
    {
        // Arrange & Act
        var member = new OrganizationMember { OrganizationRole = role };

        // Assert
        member.OrganizationRole.Should().Be(role);
    }

    [Fact]
    public void OrganizationMember_NewMember_ShouldHaveUserRole()
    {
        // Arrange & Act
        var member = new OrganizationMember();

        // Assert
        member.OrganizationRole.Should().Be(OrganizationRole.User, "new members should have 'User' role by default");
    }

    [Fact]
    public void OrganizationMember_ShouldHaveNavigationProperties()
    {
        // Arrange
        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test Org",
            Slug = "test-org"
        };
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Username = "testuser",
            PasswordHash = "hash",
            FirstName = "Test",
            LastName = "User"
        };

        // Act
        var member = new OrganizationMember
        {
            OrganizationId = organization.Id,
            UserId = user.Id,
            Organization = organization,
            User = user
        };

        // Assert
        member.Organization.Should().BeSameAs(organization);
        member.User.Should().BeSameAs(user);
    }
}
