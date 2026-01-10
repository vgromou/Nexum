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
        var entries = ChangeTracker.Entries<BaseEntity>();
        var now = DateTime.UtcNow;

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.UpdatedAt = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }
    }
}
