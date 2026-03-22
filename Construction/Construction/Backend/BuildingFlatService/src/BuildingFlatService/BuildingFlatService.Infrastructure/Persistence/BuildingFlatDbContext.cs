using BuildingFlatService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BuildingFlatService.Infrastructure.Persistence;

public class BuildingFlatDbContext : DbContext
{
    public BuildingFlatDbContext(DbContextOptions<BuildingFlatDbContext> options) : base(options) { }

    public DbSet<Building> Buildings => Set<Building>();
    public DbSet<Flat> Flats => Set<Flat>();
    public DbSet<GallerySection> GallerySections => Set<GallerySection>();
    public DbSet<GalleryPhoto> GalleryPhotos => Set<GalleryPhoto>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ───── Building Configuration ─────
        modelBuilder.Entity<Building>(entity =>
        {
            entity.ToTable("Buildings");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(150);

            entity.Property(e => e.Address)
                .IsRequired()
                .HasMaxLength(300);

            entity.Property(e => e.City)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.TotalFloors)
                .IsRequired();

            entity.Property(e => e.TotalFlats)
                .IsRequired();

            entity.Property(e => e.BaseAreaSqFt)
                .IsRequired()
                .HasColumnType("float");

            entity.Property(e => e.BuildingType)
                .IsRequired()
                .HasMaxLength(50)
                .HasDefaultValue("Residential");

            entity.Property(e => e.YearBuilt)
                .IsRequired(false);

            entity.Property(e => e.Description)
                .IsRequired(false)
                .HasMaxLength(1000);

            entity.Property(e => e.Latitude)
                .IsRequired(false)
                .HasColumnType("float");

            entity.Property(e => e.Longitude)
                .IsRequired(false)
                .HasColumnType("float");

            entity.Property(e => e.ShowOnMap)
                .IsRequired()
                .HasDefaultValue(false);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // One Building → Many Flats (cascade delete)
            entity.HasMany(e => e.Flats)
                .WithOne(f => f.Building)
                .HasForeignKey(f => f.BuildingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ───── Flat Configuration ─────
        modelBuilder.Entity<Flat>(entity =>
        {
            entity.ToTable("Flats");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.FlatNumber)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(e => e.FloorNumber)
                .IsRequired();

            entity.Property(e => e.AreaInSqFt)
                .IsRequired()
                .HasColumnType("decimal(10,2)");

            entity.Property(e => e.Price)
                .IsRequired()
                .HasColumnType("decimal(18,2)");

            entity.Property(e => e.IsAvailable)
                .IsRequired()
                .HasDefaultValue(true);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Index for common query: flats by building
            entity.HasIndex(e => e.BuildingId);

            // Composite unique: no duplicate flat numbers within the same building
            entity.HasIndex(e => new { e.BuildingId, e.FlatNumber })
                .IsUnique();
        });

        // ───── GallerySection Configuration ─────
        modelBuilder.Entity<GallerySection>(entity =>
        {
            entity.ToTable("GallerySections");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Description)
                .IsRequired(false)
                .HasMaxLength(500);

            entity.Property(e => e.DisplayOrder)
                .HasDefaultValue(0);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // One Section → Many Photos (cascade delete)
            entity.HasMany(e => e.Photos)
                .WithOne(p => p.Section)
                .HasForeignKey(p => p.SectionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ───── GalleryPhoto Configuration ─────
        modelBuilder.Entity<GalleryPhoto>(entity =>
        {
            entity.ToTable("GalleryPhotos");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Description)
                .IsRequired(false)
                .HasMaxLength(1000);

            entity.Property(e => e.ImageUrl)
                .IsRequired()
                .HasColumnType("nvarchar(max)"); // Support large base64 images

            entity.Property(e => e.ThumbnailUrl)
                .IsRequired(false)
                .HasColumnType("nvarchar(max)"); // Support large base64 thumbnails

            entity.Property(e => e.DisplayOrder)
                .HasDefaultValue(0);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // FK to Section (required)
            entity.HasIndex(e => e.SectionId);

            // FK to Building (optional)
            entity.HasOne(e => e.Building)
                .WithMany()
                .HasForeignKey(e => e.BuildingId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.BuildingId);
        });
    }
}
