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

    // Spaces schema
    public DbSet<Space> Spaces => Set<Space>();
    public DbSet<SpaceMember> SpaceMembers => Set<SpaceMember>();
    public DbSet<SpaceSettings> SpaceSettings => Set<SpaceSettings>();

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
            entity.Property(e => e.AvatarStoragePath).HasMaxLength(200);

            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.LockoutUntil);
            entity.HasIndex(e => e.AvatarStoragePath);
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

        // Space configuration (spaces schema)
        modelBuilder.Entity<Space>(entity =>
        {
            entity.ToTable("spaces", "spaces");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(256).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Icon).HasMaxLength(100);
            entity.Property(e => e.Slug).HasMaxLength(100).IsRequired();
            entity.Property(e => e.DefaultAccess)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();
            entity.Property(e => e.IsArchived)
                .HasDefaultValue(false);

            entity.HasIndex(e => new { e.OrganizationId, e.Slug })
                .IsUnique()
                .HasDatabaseName("uq_spaces_org_slug");
            entity.HasIndex(e => e.OrganizationId)
                .HasDatabaseName("ix_spaces_organization");
            entity.HasOne(e => e.Organization)
                .WithMany(o => o.Spaces)
                .HasForeignKey(e => e.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // SpaceMember configuration (spaces schema)
        modelBuilder.Entity<SpaceMember>(entity =>
        {
            entity.ToTable("space_members", "spaces");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Role)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.HasIndex(e => new { e.SpaceId, e.UserId })
                .IsUnique()
                .HasDatabaseName("uq_space_members_space_user");
            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("ix_space_members_user");
            entity.HasIndex(e => new { e.SpaceId, e.Role })
                .HasDatabaseName("ix_space_members_space_role");

            entity.HasOne(e => e.Space)
                .WithMany(s => s.Members)
                .HasForeignKey(e => e.SpaceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.SpaceMemberships)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.InvitedByUser)
                .WithMany(u => u.InvitedSpaceMembers)
                .HasForeignKey(e => e.InvitedBy)
                .OnDelete(DeleteBehavior.SetNull);

            entity.ToTable(t => t.HasCheckConstraint(
                "ck_space_members_role_not_private",
                "role <> 'Private'"));
        });

        // SpaceSettings configuration (spaces schema, 1:1 shared PK)
        modelBuilder.Entity<SpaceSettings>(entity =>
        {
            entity.ToTable("space_settings", "spaces");
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Space)
                .WithOne(s => s.Settings)
                .HasForeignKey<SpaceSettings>(e => e.Id)
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

        // Set CreatedAt for all new entities (only if not already set)
        foreach (var entry in ChangeTracker.Entries<BaseEntity>()
            .Where(e => e.State == EntityState.Added && e.Entity.CreatedAt == default))
        {
            entry.Entity.CreatedAt = now;
        }

        // Set UpdatedAt only for auditable entities (not for immutable logs)
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Modified)
            {
                // Always update on modification
                entry.Entity.UpdatedAt = now;
            }
            else if (entry.State == EntityState.Added && entry.Entity.UpdatedAt == default)
            {
                // Only set on creation if not already set
                entry.Entity.UpdatedAt = now;
            }
        }
    }
}
