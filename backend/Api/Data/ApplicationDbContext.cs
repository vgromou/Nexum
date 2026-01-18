using Microsoft.EntityFrameworkCore;
using Api.Models;

namespace Api.Data;

/// <summary>
/// Application database context
/// </summary>
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Core schema
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrganizationMember> OrganizationMembers => Set<OrganizationMember>();

    // Auth schema
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<LoginAttempt> LoginAttempts => Set<LoginAttempt>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Organization configuration (core schema)
        modelBuilder.Entity<Organization>(entity =>
        {
            entity.ToTable("organizations", "core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Slug).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LogoUrl).HasMaxLength(500);

            entity.HasIndex(e => e.Slug).IsUnique();
        });

        // User configuration (auth schema)
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users", "auth");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Username).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PasswordHash).HasMaxLength(255).IsRequired();
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Position).HasMaxLength(200);
            entity.Property(e => e.AvatarUrl).HasMaxLength(500);

            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.LockoutUntil);
        });

        // OrganizationMember configuration (core schema)
        modelBuilder.Entity<OrganizationMember>(entity =>
        {
            entity.ToTable("organization_members", "core");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OrganizationRole).HasConversion<string>().HasMaxLength(20).IsRequired();

            // Unique on UserId - enforces single-org (MVP)
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => new { e.OrganizationId, e.OrganizationRole })
                .HasDatabaseName("ix_organization_members_org_role");

            entity.HasOne(e => e.Organization)
                .WithMany(o => o.Members)
                .HasForeignKey(e => e.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.OrganizationMemberships)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // RefreshToken configuration (auth schema)
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens", "auth");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TokenHash).HasMaxLength(255).IsRequired();
            entity.Property(e => e.RevokedReason).HasMaxLength(50);
            entity.Property(e => e.DeviceInfo).HasMaxLength(500);
            entity.Property(e => e.IpAddress).HasColumnType("inet");

            entity.HasIndex(e => e.TokenHash).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ExpiresAt);
            entity.HasIndex(e => e.RevokedAt);

            entity.HasOne(e => e.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // LoginAttempt configuration (auth schema)
        modelBuilder.Entity<LoginAttempt>(entity =>
        {
            entity.ToTable("login_attempts", "auth");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.LoginIdentifier).HasMaxLength(255).IsRequired();
            entity.Property(e => e.IpAddress).HasColumnType("inet");
            entity.Property(e => e.FailureReason).HasMaxLength(100);
            entity.Property(e => e.UserAgent).HasMaxLength(500);

            entity.HasIndex(e => e.LoginIdentifier);
            entity.HasIndex(e => e.IpAddress);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.LoginIdentifier, e.CreatedAt });
        });
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var now = DateTime.UtcNow;

        // Set CreatedAt for all new entities
        foreach (var entry in ChangeTracker.Entries<BaseEntity>()
            .Where(e => e.State == EntityState.Added))
        {
            entry.Entity.CreatedAt = now;
        }

        // Set UpdatedAt only for auditable entities (not for immutable logs)
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }
    }
}
