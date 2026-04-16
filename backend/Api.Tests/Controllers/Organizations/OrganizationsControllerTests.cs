using System.Security.Claims;
using Api.Controllers.Organizations;
using Api.Data;
using Api.DTOs.Common;
using Api.DTOs.Organizations;
using Api.Exceptions;
using Api.Models;
using AwesomeAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Time.Testing;
using Moq;

namespace Api.Tests.Controllers.Organizations;

public class OrganizationsControllerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly FakeTimeProvider _timeProvider;
    private readonly Mock<IWebHostEnvironment> _environment;
    private readonly OrganizationsController _controller;

    public OrganizationsControllerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _context = new ApplicationDbContext(options);
        _timeProvider = new FakeTimeProvider(new DateTimeOffset(2025, 1, 15, 12, 0, 0, TimeSpan.Zero));

        _environment = new Mock<IWebHostEnvironment>();
        _environment.Setup(e => e.EnvironmentName).Returns("Testing");

        _controller = new OrganizationsController(_context, _timeProvider, _environment.Object);
    }

    private void SetupControllerContext(Guid organizationId)
    {
        var claims = new List<Claim>
        {
            new Claim("org_id", organizationId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, "admin")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    private async Task<Organization> CreateExistingOrganizationAsync(
        string name = "Existing Org",
        string slug = "existing-org",
        string? logoUrl = null)
    {
        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = name,
            Slug = slug,
            LogoUrl = logoUrl,
            CreatedAt = now,
            UpdatedAt = now
        };
        _context.Organizations.Add(organization);
        await _context.SaveChangesAsync();
        return organization;
    }

    #region CreateOrganization Tests

    [Fact]
    public async Task CreateOrganization_WithValidRequest_ShouldReturn201Created()
    {
        // Arrange
        var request = new CreateOrganizationRequest
        {
            Name = "Acme Corporation"
        };

        // Act
        var result = await _controller.CreateOrganization(request, CancellationToken.None);

        // Assert
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.StatusCode.Should().Be(201);

        var response = createdResult.Value.Should().BeOfType<OrganizationResponse>().Subject;
        response.Name.Should().Be("Acme Corporation");
        response.Id.Should().NotBeEmpty();
    }

    [Fact]
    public async Task CreateOrganization_WithoutSlug_ShouldAutoGenerateFromName()
    {
        // Arrange
        var request = new CreateOrganizationRequest
        {
            Name = "Acme Corporation"
        };

        // Act
        var result = await _controller.CreateOrganization(request, CancellationToken.None);

        // Assert
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var response = createdResult.Value.Should().BeOfType<OrganizationResponse>().Subject;
        response.Slug.Should().Be("acme-corporation");
    }

    [Fact]
    public async Task CreateOrganization_WithProvidedSlug_ShouldUseIt()
    {
        // Arrange
        var request = new CreateOrganizationRequest
        {
            Name = "Acme Corporation",
            Slug = "acme"
        };

        // Act
        var result = await _controller.CreateOrganization(request, CancellationToken.None);

        // Assert
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var response = createdResult.Value.Should().BeOfType<OrganizationResponse>().Subject;
        response.Slug.Should().Be("acme");
    }

    [Fact]
    public async Task CreateOrganization_WhenOrganizationExists_ShouldThrowConflictException()
    {
        // Arrange
        await CreateExistingOrganizationAsync();

        var request = new CreateOrganizationRequest
        {
            Name = "New Organization"
        };

        // Act
        var act = () => _controller.CreateOrganization(request, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*organization already exists*single-tenant*");
    }

    [Fact]
    public async Task CreateOrganization_ShouldPersistToDatabase()
    {
        // Arrange
        var request = new CreateOrganizationRequest
        {
            Name = "Persistent Org",
            Slug = "persistent",
            LogoUrl = "https://example.com/logo.png"
        };

        // Act
        await _controller.CreateOrganization(request, CancellationToken.None);

        // Assert
        var organization = await _context.Organizations.FirstAsync();
        organization.Should().NotBeNull();
        organization.Name.Should().Be("Persistent Org");
        organization.Slug.Should().Be("persistent");
        organization.LogoUrl.Should().Be("https://example.com/logo.png");
    }

    [Fact]
    public async Task CreateOrganization_ShouldTrimName()
    {
        // Arrange
        var request = new CreateOrganizationRequest
        {
            Name = "  Trimmed Name  "
        };

        // Act
        var result = await _controller.CreateOrganization(request, CancellationToken.None);

        // Assert
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var response = createdResult.Value.Should().BeOfType<OrganizationResponse>().Subject;
        response.Name.Should().Be("Trimmed Name");
    }

    [Fact]
    public async Task CreateOrganization_ShouldTrimLogoUrl()
    {
        // Arrange
        var request = new CreateOrganizationRequest
        {
            Name = "Test Org",
            LogoUrl = "  https://example.com/logo.png  "
        };

        // Act
        var result = await _controller.CreateOrganization(request, CancellationToken.None);

        // Assert
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var response = createdResult.Value.Should().BeOfType<OrganizationResponse>().Subject;
        response.LogoUrl.Should().Be("https://example.com/logo.png");
    }

    [Fact]
    public async Task CreateOrganization_ShouldSetTimestamps()
    {
        // Arrange
        var request = new CreateOrganizationRequest
        {
            Name = "Timestamp Org"
        };
        var expectedTime = _timeProvider.GetUtcNow().UtcDateTime;

        // Act
        var result = await _controller.CreateOrganization(request, CancellationToken.None);

        // Assert
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var response = createdResult.Value.Should().BeOfType<OrganizationResponse>().Subject;
        response.CreatedAt.Should().Be(expectedTime);
        response.UpdatedAt.Should().Be(expectedTime);
    }

    [Fact]
    public async Task CreateOrganization_ShouldReturnCreatedAtActionResult()
    {
        // Arrange
        var request = new CreateOrganizationRequest
        {
            Name = "Route Test Org"
        };

        // Act
        var result = await _controller.CreateOrganization(request, CancellationToken.None);

        // Assert
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.ActionName.Should().Be(nameof(OrganizationsController.GetOrganization));
        createdResult.RouteValues.Should().ContainKey("organizationId");

        var response = createdResult.Value.Should().BeOfType<OrganizationResponse>().Subject;
        createdResult.RouteValues!["organizationId"].Should().Be(response.Id);
    }

    [Fact]
    public async Task CreateOrganization_WithNullLogoUrl_ShouldSetNull()
    {
        // Arrange
        var request = new CreateOrganizationRequest
        {
            Name = "No Logo Org",
            LogoUrl = null
        };

        // Act
        var result = await _controller.CreateOrganization(request, CancellationToken.None);

        // Assert
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var response = createdResult.Value.Should().BeOfType<OrganizationResponse>().Subject;
        response.LogoUrl.Should().BeNull();
    }

    [Theory]
    [InlineData("Test Org", "test-org")]
    [InlineData("My Company", "my-company")]
    [InlineData("UPPERCASE", "uppercase")]
    [InlineData("Special!@#Chars", "specialchars")]
    [InlineData("Multiple   Spaces", "multiple-spaces")]
    [InlineData("123 Numbers First", "org-123-numbers-first")]
    [InlineData("---Dashes---", "dashes")]
    public async Task CreateOrganization_SlugGeneration_ShouldFollowRules(string name, string expectedSlug)
    {
        // Arrange
        var request = new CreateOrganizationRequest
        {
            Name = name
        };

        // Act
        var result = await _controller.CreateOrganization(request, CancellationToken.None);

        // Assert
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var response = createdResult.Value.Should().BeOfType<OrganizationResponse>().Subject;
        response.Slug.Should().Be(expectedSlug);
    }

    #endregion

    #region GetOrganizations Tests

    [Fact]
    public async Task GetOrganizations_WhenNoOrganizations_ShouldReturnEmptyList()
    {
        // Act
        var result = await _controller.GetOrganizations(CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<OrganizationResponse>>().Subject;
        response.Items.Should().BeEmpty();
        response.TotalItems.Should().Be(0);
    }

    [Fact]
    public async Task GetOrganizations_WhenOrganizationExists_ShouldReturnList()
    {
        // Arrange
        var org = await CreateExistingOrganizationAsync(
            name: "Test Org",
            slug: "test-org",
            logoUrl: "https://example.com/logo.png");

        // Act
        var result = await _controller.GetOrganizations(CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<OrganizationResponse>>().Subject;
        response.Items.Should().HaveCount(1);
        response.TotalItems.Should().Be(1);

        var item = response.Items[0];
        item.Id.Should().Be(org.Id);
        item.Name.Should().Be("Test Org");
        item.Slug.Should().Be("test-org");
        item.LogoUrl.Should().Be("https://example.com/logo.png");
    }

    [Fact]
    public async Task GetOrganizations_ShouldReturnCorrectTotal()
    {
        // Arrange
        await CreateExistingOrganizationAsync();

        // Act
        var result = await _controller.GetOrganizations(CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<OrganizationResponse>>().Subject;
        response.TotalItems.Should().Be(response.Items.Count);
    }

    [Fact]
    public async Task GetOrganizations_WithNullLogoUrl_ShouldReturnNullInItem()
    {
        // Arrange
        await CreateExistingOrganizationAsync(logoUrl: null);

        // Act
        var result = await _controller.GetOrganizations(CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PagedResponse<OrganizationResponse>>().Subject;
        response.Items[0].LogoUrl.Should().BeNull();
    }

    #endregion

    #region GetOrganization Tests

    [Fact]
    public async Task GetOrganization_WithValidId_ShouldReturn200Ok()
    {
        // Arrange
        var org = await CreateExistingOrganizationAsync(
            name: "Get Test Org",
            slug: "get-test",
            logoUrl: "https://example.com/logo.png");

        // Act
        var result = await _controller.GetOrganization(org.Id, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<OrganizationResponse>().Subject;
        response.Id.Should().Be(org.Id);
        response.Name.Should().Be("Get Test Org");
        response.Slug.Should().Be("get-test");
        response.LogoUrl.Should().Be("https://example.com/logo.png");
    }

    [Fact]
    public async Task GetOrganization_WithNonExistentId_ShouldThrowNotFoundException()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act
        var act = () => _controller.GetOrganization(nonExistentId, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"*Organization*{nonExistentId}*not found*");
    }

    [Fact]
    public async Task GetOrganization_ShouldReturnAllFields()
    {
        // Arrange
        var org = await CreateExistingOrganizationAsync();

        // Act
        var result = await _controller.GetOrganization(org.Id, CancellationToken.None);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<OrganizationResponse>().Subject;
        response.Id.Should().NotBeEmpty();
        response.Name.Should().NotBeEmpty();
        response.Slug.Should().NotBeEmpty();
        response.CreatedAt.Should().NotBe(default);
        response.UpdatedAt.Should().NotBe(default);
    }

    #endregion

    #region DeleteOrganization Tests

    [Fact]
    public async Task DeleteOrganization_WithValidIdAndConfirmHeader_ShouldReturn204NoContent()
    {
        // Arrange
        var org = await CreateExistingOrganizationAsync();
        SetupControllerContext(org.Id);

        // Act
        var result = await _controller.DeleteOrganization(org.Id, confirmDelete: true, CancellationToken.None);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteOrganization_WithValidIdAndConfirmHeader_ShouldRemoveFromDatabase()
    {
        // Arrange
        var org = await CreateExistingOrganizationAsync();
        SetupControllerContext(org.Id);

        // Act
        await _controller.DeleteOrganization(org.Id, confirmDelete: true, CancellationToken.None);

        // Assert
        var organizationInDb = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == org.Id);
        organizationInDb.Should().BeNull();
    }

    [Fact]
    public async Task DeleteOrganization_WithoutConfirmHeader_ShouldThrowValidationException()
    {
        // Arrange
        var org = await CreateExistingOrganizationAsync();
        SetupControllerContext(org.Id);

        // Act
        var act = () => _controller.DeleteOrganization(org.Id, confirmDelete: false, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*X-Confirm-Delete*");
    }

    [Fact]
    public async Task DeleteOrganization_WithNonExistentId_ShouldThrowNotFoundException()
    {
        // Arrange
        var org = await CreateExistingOrganizationAsync();
        var nonExistentId = Guid.NewGuid();
        SetupControllerContext(nonExistentId);

        // Act
        var act = () => _controller.DeleteOrganization(nonExistentId, confirmDelete: true, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>()
            .WithMessage($"*Organization*{nonExistentId}*not found*");
    }

    [Fact]
    public async Task DeleteOrganization_WithDifferentOrganization_ShouldThrowForbiddenException()
    {
        // Arrange
        var org = await CreateExistingOrganizationAsync();
        var differentOrgId = Guid.NewGuid();
        SetupControllerContext(differentOrgId);

        // Act
        var act = () => _controller.DeleteOrganization(org.Id, confirmDelete: true, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("*delete this organization*");
    }

    [Fact]
    public async Task DeleteOrganization_ShouldCascadeDeleteMembers()
    {
        // Arrange
        var org = await CreateExistingOrganizationAsync();
        SetupControllerContext(org.Id);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            Username = "testuser",
            PasswordHash = "hash",
            FirstName = "Test",
            LastName = "User",
            CreatedAt = _timeProvider.GetUtcNow().UtcDateTime,
            UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime
        };
        _context.Users.Add(user);

        var member = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            UserId = user.Id,
            OrganizationRole = OrganizationRole.Admin,
            JoinedAt = _timeProvider.GetUtcNow().UtcDateTime,
            CreatedAt = _timeProvider.GetUtcNow().UtcDateTime,
            UpdatedAt = _timeProvider.GetUtcNow().UtcDateTime
        };
        _context.OrganizationMembers.Add(member);
        await _context.SaveChangesAsync();

        // Act
        await _controller.DeleteOrganization(org.Id, confirmDelete: true, CancellationToken.None);

        // Assert
        var membersInDb = await _context.OrganizationMembers
            .Where(m => m.OrganizationId == org.Id)
            .ToListAsync();
        membersInDb.Should().BeEmpty();

        // User should still exist
        var userInDb = await _context.Users.FirstOrDefaultAsync(u => u.Id == user.Id);
        userInDb.Should().NotBeNull();
    }

    [Fact]
    public async Task DeleteOrganization_WithoutConfirmHeader_ShouldNotDeleteOrganization()
    {
        // Arrange
        var org = await CreateExistingOrganizationAsync();
        SetupControllerContext(org.Id);

        // Act
        var act = () => _controller.DeleteOrganization(org.Id, confirmDelete: false, CancellationToken.None);
        await act.Should().ThrowAsync<ValidationException>();

        // Assert
        var organizationInDb = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == org.Id);
        organizationInDb.Should().NotBeNull();
    }

    #endregion
}
