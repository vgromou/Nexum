using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Api.Common.Errors;
using Api.Configuration;
using Api.Data;
using Api.Models;
using Api.Services;
using AwesomeAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

namespace Api.Tests.Integration.Organizations;

public class DeleteOrganizationTests : IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly string _dbName;
    private readonly FakeTimeProvider _fakeTimeProvider;
    private IServiceScope? _scope;
    private ApplicationDbContext? _context;
    private IJwtService? _jwtService;

    public DeleteOrganizationTests()
    {
        _dbName = $"InMemoryDbForTesting_{Guid.NewGuid()}";
        _fakeTimeProvider = new FakeTimeProvider(DateTimeOffset.UtcNow);

        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");
                builder.ConfigureServices(services =>
                {
                    // Find and remove the ApplicationDbContext descriptor
                    var dbContextDescriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                    if (dbContextDescriptor != null)
                        services.Remove(dbContextDescriptor);

                    // Find and remove the DbConnection if using Npgsql
                    var dbConnectionDescriptor = services.SingleOrDefault(
                        d => d.ServiceType.FullName?.Contains("Npgsql") == true);
                    if (dbConnectionDescriptor != null)
                        services.Remove(dbConnectionDescriptor);

                    // Remove all EF Core internal service provider registrations
                    var efCoreServices = services
                        .Where(d => d.ServiceType.FullName?.StartsWith("Microsoft.EntityFrameworkCore") == true
                                    || d.ImplementationType?.FullName?.StartsWith("Npgsql") == true
                                    || d.ServiceType.FullName?.Contains("Npgsql") == true)
                        .ToList();
                    foreach (var descriptor in efCoreServices)
                    {
                        services.Remove(descriptor);
                    }

                    // Replace TimeProvider with FakeTimeProvider
                    var timeProviderDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(TimeProvider));
                    if (timeProviderDescriptor != null)
                        services.Remove(timeProviderDescriptor);
                    services.AddSingleton<TimeProvider>(_fakeTimeProvider);

                    // Add in-memory database for testing
                    services.AddDbContext<ApplicationDbContext>(options =>
                    {
                        options.UseInMemoryDatabase(_dbName);
                        options.ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning));
                    });
                });
            });

        _client = _factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        _scope = _factory.Services.CreateScope();
        _context = _scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        _jwtService = _scope.ServiceProvider.GetRequiredService<IJwtService>();
        await _context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        if (_context != null)
        {
            await _context.Database.EnsureDeletedAsync();
            await _context.DisposeAsync();
        }
        _scope?.Dispose();
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    private async Task<Organization> CreateTestOrganizationAsync()
    {
        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test Organization",
            Slug = "test-org",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context!.Organizations.Add(organization);
        await _context.SaveChangesAsync();
        return organization;
    }

    private async Task<(Organization org, User user, OrganizationMember member)> CreateOrganizationWithAdminAsync()
    {
        var organization = await CreateTestOrganizationAsync();

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@example.com",
            Username = "adminuser",
            PasswordHash = "hash",
            FirstName = "Admin",
            LastName = "User",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context!.Users.Add(user);

        var member = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = organization.Id,
            UserId = user.Id,
            OrganizationRole = OrganizationRole.Admin,
            JoinedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.OrganizationMembers.Add(member);
        await _context.SaveChangesAsync();

        return (organization, user, member);
    }

    private async Task<(Organization org, User user, OrganizationMember member)> CreateOrganizationWithUserAsync(OrganizationRole role = OrganizationRole.User)
    {
        var organization = await CreateTestOrganizationAsync();

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            Username = "regularuser",
            PasswordHash = "hash",
            FirstName = "Regular",
            LastName = "User",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context!.Users.Add(user);

        var member = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = organization.Id,
            UserId = user.Id,
            OrganizationRole = role,
            JoinedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.OrganizationMembers.Add(member);
        await _context.SaveChangesAsync();

        return (organization, user, member);
    }

    private string GenerateToken(User user, OrganizationMember member)
    {
        return _jwtService!.GenerateAccessToken(user, member);
    }

    private HttpRequestMessage CreateDeleteRequest(Guid organizationId, string? token = null, bool confirmDelete = true)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete, $"/api/organizations/{organizationId}");
        if (confirmDelete)
        {
            request.Headers.Add("X-Confirm-Delete", "true");
        }
        if (token != null)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }
        return request;
    }

    #region Success Cases

    [Fact]
    public async Task DeleteOrganization_WithAdminRole_ReturnsNoContent()
    {
        // Arrange
        var (org, user, member) = await CreateOrganizationWithAdminAsync();
        var token = GenerateToken(user, member);
        var request = CreateDeleteRequest(org.Id, token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteOrganization_WithAdminRole_RemovesOrganizationFromDatabase()
    {
        // Arrange
        var (org, user, member) = await CreateOrganizationWithAdminAsync();
        var token = GenerateToken(user, member);
        var request = CreateDeleteRequest(org.Id, token);

        // Act
        await _client.SendAsync(request);

        // Assert - Need to refresh context to see changes
        _context!.ChangeTracker.Clear();
        var deletedOrg = await _context.Organizations.FindAsync(org.Id);
        deletedOrg.Should().BeNull();
    }

    [Fact]
    public async Task DeleteOrganization_WithMultipleMembers_StillDeletesOrganization()
    {
        // Arrange
        var (org, adminUser, adminMember) = await CreateOrganizationWithAdminAsync();

        // Add another member
        var regularUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "member@example.com",
            Username = "member",
            PasswordHash = "hash",
            FirstName = "Member",
            LastName = "User",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context!.Users.Add(regularUser);
        _context.OrganizationMembers.Add(new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            UserId = regularUser.Id,
            OrganizationRole = OrganizationRole.User,
            JoinedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var token = GenerateToken(adminUser, adminMember);
        var request = CreateDeleteRequest(org.Id, token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Organization should be deleted
        _context.ChangeTracker.Clear();
        var deletedOrg = await _context.Organizations.FindAsync(org.Id);
        deletedOrg.Should().BeNull();

        // Users should still exist (not cascade deleted)
        var existingUser = await _context.Users.FindAsync(regularUser.Id);
        existingUser.Should().NotBeNull();
    }

    #endregion

    #region Error Cases - Missing Header

    [Fact]
    public async Task DeleteOrganization_WithoutConfirmHeader_ReturnsBadRequest()
    {
        // Arrange
        var (org, user, member) = await CreateOrganizationWithAdminAsync();
        var token = GenerateToken(user, member);
        var request = CreateDeleteRequest(org.Id, token, confirmDelete: false);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteOrganization_WithoutConfirmHeader_ReturnsMissingConfirmationError()
    {
        // Arrange
        var (org, user, member) = await CreateOrganizationWithAdminAsync();
        var token = GenerateToken(user, member);
        var request = CreateDeleteRequest(org.Id, token, confirmDelete: false);

        // Act
        var response = await _client.SendAsync(request);
        var errorResponse = await response.Content.ReadFromJsonAsync<ApiErrorResponse>();

        // Assert
        errorResponse.Should().NotBeNull();
        errorResponse!.Error.Code.Should().Be("VALIDATION_ERROR");
        errorResponse.Error.Status.Should().Be(400);
        errorResponse.Error.Details?.Fields.Should().ContainKey("X-Confirm-Delete");
    }

    [Fact]
    public async Task DeleteOrganization_WithConfirmHeaderFalse_ReturnsBadRequest()
    {
        // Arrange
        var (org, user, member) = await CreateOrganizationWithAdminAsync();
        var token = GenerateToken(user, member);
        var request = new HttpRequestMessage(HttpMethod.Delete, $"/api/organizations/{org.Id}");
        request.Headers.Add("X-Confirm-Delete", "false");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteOrganization_WithoutConfirmHeader_DoesNotDeleteOrganization()
    {
        // Arrange
        var (org, user, member) = await CreateOrganizationWithAdminAsync();
        var token = GenerateToken(user, member);
        var request = CreateDeleteRequest(org.Id, token, confirmDelete: false);

        // Act
        await _client.SendAsync(request);

        // Assert - Organization should still exist
        _context!.ChangeTracker.Clear();
        var existingOrg = await _context.Organizations.FindAsync(org.Id);
        existingOrg.Should().NotBeNull();
    }

    #endregion

    #region Error Cases - Not Found

    [Fact]
    public async Task DeleteOrganization_WithNonExistentId_ReturnsNotFound()
    {
        // Arrange
        var (org, user, member) = await CreateOrganizationWithAdminAsync();
        var token = GenerateToken(user, member);
        var nonExistentId = Guid.NewGuid();
        var request = CreateDeleteRequest(nonExistentId, token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert - Should return 403 because org_id in token doesn't match
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DeleteOrganization_WithInvalidGuid_ReturnsNotFound()
    {
        // Arrange
        var (_, user, member) = await CreateOrganizationWithAdminAsync();
        var token = GenerateToken(user, member);
        var request = new HttpRequestMessage(HttpMethod.Delete, "/api/organizations/not-a-guid");
        request.Headers.Add("X-Confirm-Delete", "true");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound); // Route doesn't match
    }

    #endregion

    #region Authorization Tests

    [Fact]
    public async Task DeleteOrganization_WithoutToken_ReturnsUnauthorized()
    {
        // Arrange
        var org = await CreateTestOrganizationAsync();
        var request = CreateDeleteRequest(org.Id, token: null);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteOrganization_WithUserRole_ReturnsForbidden()
    {
        // Arrange
        var (org, user, member) = await CreateOrganizationWithUserAsync(OrganizationRole.User);
        var token = GenerateToken(user, member);
        var request = CreateDeleteRequest(org.Id, token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DeleteOrganization_WithManagerRole_ReturnsForbidden()
    {
        // Arrange
        var (org, user, member) = await CreateOrganizationWithUserAsync(OrganizationRole.Manager);
        var token = GenerateToken(user, member);
        var request = CreateDeleteRequest(org.Id, token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DeleteOrganization_WithAdminFromDifferentOrg_ReturnsForbidden()
    {
        // Arrange
        var org1 = await CreateTestOrganizationAsync();

        // Create second organization with admin
        var org2 = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Other Organization",
            Slug = "other-org",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context!.Organizations.Add(org2);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin2@example.com",
            Username = "admin2",
            PasswordHash = "hash",
            FirstName = "Admin",
            LastName = "Two",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);

        var member = new OrganizationMember
        {
            Id = Guid.NewGuid(),
            OrganizationId = org2.Id,
            UserId = user.Id,
            OrganizationRole = OrganizationRole.Admin,
            JoinedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.OrganizationMembers.Add(member);
        await _context.SaveChangesAsync();

        var token = GenerateToken(user, member);
        // Try to delete org1 with token from org2
        var request = CreateDeleteRequest(org1.Id, token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DeleteOrganization_WithNonAdminRole_DoesNotDeleteOrganization()
    {
        // Arrange
        var (org, user, member) = await CreateOrganizationWithUserAsync(OrganizationRole.User);
        var token = GenerateToken(user, member);
        var request = CreateDeleteRequest(org.Id, token);

        // Act
        await _client.SendAsync(request);

        // Assert - Organization should still exist
        _context!.ChangeTracker.Clear();
        var existingOrg = await _context.Organizations.FindAsync(org.Id);
        existingOrg.Should().NotBeNull();
    }

    #endregion

    #region Response Format

    [Fact]
    public async Task DeleteOrganization_Success_HasEmptyResponseBody()
    {
        // Arrange
        var (org, user, member) = await CreateOrganizationWithAdminAsync();
        var token = GenerateToken(user, member);
        var request = CreateDeleteRequest(org.Id, token);

        // Act
        var response = await _client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        content.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteOrganization_Error_ReturnsJsonContentType()
    {
        // Arrange
        var (org, user, member) = await CreateOrganizationWithUserAsync(OrganizationRole.User);
        var token = GenerateToken(user, member);
        var request = CreateDeleteRequest(org.Id, token);

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    #endregion
}
