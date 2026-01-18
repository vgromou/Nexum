using Api.Models;
using FluentAssertions;

namespace Api.Tests.Models;

public class OrganizationTests
{
    [Fact]
    public void Organization_ShouldHaveDefaultValues()
    {
        // Arrange & Act
        var organization = new Organization();

        // Assert
        organization.Name.Should().BeEmpty();
        organization.Slug.Should().BeEmpty();
        organization.LogoUrl.Should().BeNull();
        organization.Members.Should().BeEmpty();
    }

    [Fact]
    public void Organization_ShouldSetProperties()
    {
        // Arrange & Act
        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Acme Corp",
            Slug = "acme-corp",
            LogoUrl = "https://example.com/logo.png"
        };

        // Assert
        organization.Name.Should().Be("Acme Corp");
        organization.Slug.Should().Be("acme-corp");
        organization.LogoUrl.Should().Be("https://example.com/logo.png");
    }

    [Fact]
    public void Organization_ShouldInitializeMembersCollection()
    {
        // Arrange
        var organization = new Organization();

        // Act & Assert
        organization.Members.Should().NotBeNull();
        organization.Members.Should().BeAssignableTo<ICollection<OrganizationMember>>();
    }
}
