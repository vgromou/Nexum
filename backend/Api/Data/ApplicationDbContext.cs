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

    public DbSet<Space> Spaces => Set<Space>();
    public DbSet<Page> Pages => Set<Page>();
    public DbSet<Block> Blocks => Set<Block>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<LoginAttempt> LoginAttempts => Set<LoginAttempt>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Space configuration
        modelBuilder.Entity<Space>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Icon).HasMaxLength(100);
            entity.Property(e => e.IconColor).HasMaxLength(50);
            entity.HasIndex(e => e.SortOrder);
        });

        // Page configuration
        modelBuilder.Entity<Page>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(500).IsRequired();
            entity.Property(e => e.Icon).HasMaxLength(100);
            entity.Property(e => e.IconColor).HasMaxLength(50);
            entity.Property(e => e.CoverImage).HasMaxLength(2000);
            
            entity.HasIndex(e => e.SpaceId);
            entity.HasIndex(e => e.ParentPageId);
            entity.HasIndex(e => e.IsArchived);
            entity.HasIndex(e => e.IsFavorite);
            
            entity.HasOne(e => e.Space)
                .WithMany(s => s.Pages)
                .HasForeignKey(e => e.SpaceId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(e => e.ParentPage)
                .WithMany(p => p.ChildPages)
                .HasForeignKey(e => e.ParentPageId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Block configuration
        modelBuilder.Entity<Block>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Content).HasColumnType("text");
            entity.Property(e => e.Language).HasMaxLength(50);
            entity.Property(e => e.ImageUrl).HasMaxLength(2000);
            entity.Property(e => e.ImageCaption).HasMaxLength(1000);
            entity.Property(e => e.Properties).HasColumnType("jsonb");

            entity.HasIndex(e => e.PageId);
            entity.HasIndex(e => e.ParentBlockId);
            entity.HasIndex(e => new { e.PageId, e.SortOrder });

            entity.HasOne(e => e.Page)
                .WithMany(p => p.Blocks)
                .HasForeignKey(e => e.PageId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ParentBlock)
                .WithMany(b => b.ChildBlocks)
                .HasForeignKey(e => e.ParentBlockId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Organization configuration
        modelBuilder.Entity<Organization>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Slug).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LogoUrl).HasMaxLength(2000);

            entity.HasIndex(e => e.Slug).IsUnique();
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.NormalizedEmail).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Username).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PasswordHash).HasMaxLength(255).IsRequired();
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.LastName).HasMaxLength(100);
            entity.Property(e => e.Role).HasConversion<string>().HasMaxLength(50);
            entity.Property(e => e.Position).HasMaxLength(200);
            entity.Property(e => e.AvatarUrl).HasMaxLength(2000);

            entity.HasIndex(e => e.NormalizedEmail).IsUnique();
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.OrganizationId);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.LockoutUntil);

            entity.HasOne(e => e.Organization)
                .WithMany(o => o.Users)
                .HasForeignKey(e => e.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // RefreshToken configuration
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TokenHash).HasMaxLength(255).IsRequired();
            entity.Property(e => e.RevokedReason).HasMaxLength(100);
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

        // LoginAttempt configuration
        modelBuilder.Entity<LoginAttempt>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.IpAddress).HasColumnType("inet");
            entity.Property(e => e.FailureReason).HasMaxLength(100);
            entity.Property(e => e.UserAgent).HasMaxLength(1000);

            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.IpAddress);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.Email, e.CreatedAt });
        });
    }

    public override int SaveChanges()
    {
        ProcessEntities();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ProcessEntities();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ProcessEntities()
    {
        UpdateTimestamps();
        NormalizeEmails();
    }

    private void NormalizeEmails()
    {
        foreach (var entry in ChangeTracker.Entries<User>()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified))
        {
            entry.Entity.NormalizedEmail = entry.Entity.Email.ToLowerInvariant();
        }
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
