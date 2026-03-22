namespace BuildingFlatService.Application.DTOs.Gallery;

// ═══════════════════════════════════════════════════════════
//  SECTION DTOs
// ═══════════════════════════════════════════════════════════

public class GallerySectionReadDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int PhotoCount { get; set; }
}

public class GallerySectionDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<GalleryPhotoReadDto> Photos { get; set; } = new();
}

public class CreateGallerySectionDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}

public class UpdateGallerySectionDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

// ═══════════════════════════════════════════════════════════
//  PHOTO DTOs
// ═══════════════════════════════════════════════════════════

public class GalleryPhotoReadDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int SectionId { get; set; }
    public string SectionName { get; set; } = string.Empty;
    public int? BuildingId { get; set; }
    public string? BuildingName { get; set; }
}

public class CreateGalleryPhotoDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ImageUrl { get; set; } = string.Empty; // URL or base64 data URI
    public string? ThumbnailUrl { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public int SectionId { get; set; }
    public int? BuildingId { get; set; } // null = general portfolio photo
}

public class UpdateGalleryPhotoDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public int SectionId { get; set; }
    public int? BuildingId { get; set; }
}
