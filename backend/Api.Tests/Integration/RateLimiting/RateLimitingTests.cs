using System.Net;
using System.Net.Http.Json;
using Api.Common.Errors;
using Api.Data;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;

namespace Api.Tests.Integration.RateLimiting;

public class RateLimitingTests : IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly string _dbName;

    public RateLimitingTests()
    {
        _dbName = $"InMemoryDbForTesting_{Guid.NewGuid()}";

        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");
                builder.ConfigureServices(services =>
                {
                    // Remove existing DbContext and replace with in-memory
                    var dbContextDescriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                    if (dbContextDescriptor != null)
                        services.Remove(dbContextDescriptor);

                    var efCoreServices = services
                        .Where(d => d.ServiceType.FullName?.StartsWith("Microsoft.EntityFrameworkCore") == true
                                    || d.ImplementationType?.FullName?.StartsWith("Npgsql") == true
                                    || d.ServiceType.FullName?.Contains("Npgsql") == true)
                        .ToList();
                    foreach (var descriptor in efCoreServices)
                    {
                        services.Remove(descriptor);
                    }

                    services.AddDbContext<ApplicationDbContext>(options =>
                    {
                        options.UseInMemoryDatabase(_dbName);
                        options.ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning));
                    });
                });
            });

        _client = _factory.CreateClient();
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task Login_ExceedingRateLimit_Returns429WithProperFormat()
    {
        // Arrange - make many login attempts quickly (limit is 10 per minute)
        var loginRequest = new { login = "test@example.com", password = "wrong" };

        // Act - send 11 requests to exceed the limit of 10
        HttpResponseMessage? lastResponse = null;
        for (var i = 0; i < 12; i++)
        {
            lastResponse = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

            // If we get 429, we've hit the rate limit
            if (lastResponse.StatusCode == HttpStatusCode.TooManyRequests)
                break;
        }

        // Assert
        lastResponse.Should().NotBeNull();
        lastResponse!.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);

        var errorResponse = await lastResponse.Content.ReadFromJsonAsync<ApiErrorResponse>();
        errorResponse.Should().NotBeNull();
        errorResponse!.Error.Status.Should().Be(429);
        errorResponse.Error.Code.Should().Be("RATE_LIMIT_EXCEEDED");
        errorResponse.Error.Message.Should().Contain("Too many");
        errorResponse.Error.DisplayType.Should().Be(DisplayType.Toast);
        errorResponse.Error.Details.Should().NotBeNull();
        errorResponse.Error.Details!.Context.Should().ContainKey("retryAfterMs");
        errorResponse.Error.Details.Context.Should().ContainKey("limit");

        // Verify rate limit headers
        lastResponse.Headers.Should().ContainKey("X-RateLimit-Limit");
        lastResponse.Headers.Should().ContainKey("X-RateLimit-Remaining");
        lastResponse.Headers.Should().ContainKey("X-RateLimit-Reset");
        lastResponse.Headers.Should().ContainKey("Retry-After");
    }

    [Fact]
    public async Task Login_WithinRateLimit_DoesNotReturn429()
    {
        // Arrange - use unique client identifier to avoid interference
        var loginRequest = new { login = $"unique-{Guid.NewGuid()}@example.com", password = "wrong" };

        // Act - send just 2 requests (well within limit of 10)
        var response1 = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
        var response2 = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert - should get 401 (unauthorized) not 429
        response1.StatusCode.Should().NotBe(HttpStatusCode.TooManyRequests);
        response2.StatusCode.Should().NotBe(HttpStatusCode.TooManyRequests);
    }
}
