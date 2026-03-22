namespace BuildingFlatService.Domain.Entities;

public class GalleryPhoto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ImageUrl { get; set; } = string.Empty; // URL or base64 data URI
    public string? ThumbnailUrl { get; set; } // Optional smaller version
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ─── Section (required) ───
    public int SectionId { get; set; }
    public GallerySection Section { get; set; } = null!;

    // ─── Building (optional — null = general portfolio) ───
    public int? BuildingId { get; set; }
    public Building? Building { get; set; }
}
