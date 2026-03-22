using BuildingFlatService.Domain.Entities;

namespace BuildingFlatService.Domain.Interfaces;

public interface IGalleryRepository
{
    // Sections
    Task<IEnumerable<GallerySection>> GetAllSectionsAsync(bool includeInactive = false, CancellationToken ct = default);
    Task<GallerySection?> GetSectionByIdAsync(int id, CancellationToken ct = default);
    Task<GallerySection> CreateSectionAsync(GallerySection section, CancellationToken ct = default);
    Task<GallerySection> UpdateSectionAsync(GallerySection section, CancellationToken ct = default);
    Task DeleteSectionAsync(int id, CancellationToken ct = default);

    // Photos
    Task<IEnumerable<GalleryPhoto>> GetAllPhotosAsync(bool includeInactive = false, CancellationToken ct = default);
    Task<IEnumerable<GalleryPhoto>> GetPhotosBySectionAsync(int sectionId, CancellationToken ct = default);
    Task<IEnumerable<GalleryPhoto>> GetPhotosByBuildingAsync(int buildingId, CancellationToken ct = default);
    Task<IEnumerable<GalleryPhoto>> GetGeneralPhotosAsync(CancellationToken ct = default); // BuildingId == null
    Task<GalleryPhoto?> GetPhotoByIdAsync(int id, CancellationToken ct = default);
    Task<GalleryPhoto> CreatePhotoAsync(GalleryPhoto photo, CancellationToken ct = default);
    Task<GalleryPhoto> UpdatePhotoAsync(GalleryPhoto photo, CancellationToken ct = default);
    Task DeletePhotoAsync(int id, CancellationToken ct = default);
}
