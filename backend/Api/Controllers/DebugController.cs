#if DEBUG
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Data;

namespace Api.Controllers;

/// <summary>
/// Debug-only endpoints for testing purposes.
/// These endpoints are only available in DEBUG builds.
/// </summary>
[ApiController]
[Route("api/debug")]
[Produces("application/json")]
[Tags("Testing")]
[AllowAnonymous]
public class DebugController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DebugController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Clears all data from the database.
    /// </summary>
    /// <remarks>
    /// **WARNING:** This endpoint completely wipes all data from the database.
    /// Only available in DEBUG builds for testing purposes.
    ///
    /// Tables cleared:
    /// - auth.refresh_tokens
    /// - auth.login_attempts
    /// - core.organization_members
    /// - auth.users
    /// - core.organizations
    /// </remarks>
    /// <returns>Summary of cleared tables.</returns>
    /// <response code="200">Database cleared successfully.</response>
    [HttpPost("clear-database")]
    [ProducesResponseType(typeof(ClearDatabaseResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ClearDatabaseResponse>> ClearDatabase(CancellationToken cancellationToken)
    {
        // Count records before deletion
        var refreshTokenCount = await _context.RefreshTokens.CountAsync(cancellationToken);
        var loginAttemptCount = await _context.LoginAttempts.CountAsync(cancellationToken);
        var memberCount = await _context.OrganizationMembers.CountAsync(cancellationToken);
        var userCount = await _context.Users.CountAsync(cancellationToken);
        var orgCount = await _context.Organizations.CountAsync(cancellationToken);

        // Clear tables in correct order (respecting foreign keys)
        await _context.Database.ExecuteSqlRawAsync(
            "TRUNCATE auth.refresh_tokens, auth.login_attempts, core.organization_members, auth.users, core.organizations CASCADE",
            cancellationToken);

        return Ok(new ClearDatabaseResponse
        {
            Message = "Database cleared successfully",
            DeletedCounts = new DeletedCounts
            {
                RefreshTokens = refreshTokenCount,
                LoginAttempts = loginAttemptCount,
                OrganizationMembers = memberCount,
                Users = userCount,
                Organizations = orgCount
            }
        });
    }
}

/// <summary>
/// Response for clear database operation.
/// </summary>
public class ClearDatabaseResponse
{
    public string Message { get; set; } = string.Empty;
    public DeletedCounts DeletedCounts { get; set; } = new();
}

/// <summary>
/// Counts of deleted records per table.
/// </summary>
public class DeletedCounts
{
    public int RefreshTokens { get; set; }
    public int LoginAttempts { get; set; }
    public int OrganizationMembers { get; set; }
    public int Users { get; set; }
    public int Organizations { get; set; }
}
#endif
