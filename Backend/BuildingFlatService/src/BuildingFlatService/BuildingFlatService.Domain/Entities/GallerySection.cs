namespace BuildingFlatService.Domain.Entities;

public class GallerySection
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // e.g., "Completed Projects", "Under Construction"
    public string? Description { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<GalleryPhoto> Photos { get; set; } = new List<GalleryPhoto>();
}
