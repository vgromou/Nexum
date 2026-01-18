using Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Api.Tests;

/// <summary>
/// Factory for creating in-memory database contexts for testing
/// </summary>
public static class TestDbContextFactory
{
    public static ApplicationDbContext Create(string? databaseName = null)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName ?? Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }
}
