using BuildingFlatService.Application.DTOs.Gallery;

namespace BuildingFlatService.Application.Interfaces;

public interface IGalleryService
{
    // Sections
    Task<IEnumerable<GallerySectionReadDto>> GetAllSectionsAsync(bool includeInactive = false, CancellationToken ct = default);
    Task<GallerySectionDetailDto?> GetSectionByIdAsync(int id, CancellationToken ct = default);
    Task<GallerySectionReadDto> CreateSectionAsync(CreateGallerySectionDto dto, CancellationToken ct = default);
    Task<GallerySectionReadDto> UpdateSectionAsync(int id, UpdateGallerySectionDto dto, CancellationToken ct = default);
    Task DeleteSectionAsync(int id, CancellationToken ct = default);

    // Photos
    Task<IEnumerable<GalleryPhotoReadDto>> GetAllPhotosAsync(bool includeInactive = false, CancellationToken ct = default);
    Task<IEnumerable<GalleryPhotoReadDto>> GetPhotosBySectionAsync(int sectionId, CancellationToken ct = default);
    Task<IEnumerable<GalleryPhotoReadDto>> GetPhotosByBuildingAsync(int buildingId, CancellationToken ct = default);
    Task<IEnumerable<GalleryPhotoReadDto>> GetGeneralPhotosAsync(CancellationToken ct = default);
    Task<GalleryPhotoReadDto?> GetPhotoByIdAsync(int id, CancellationToken ct = default);
    Task<GalleryPhotoReadDto> CreatePhotoAsync(CreateGalleryPhotoDto dto, CancellationToken ct = default);
    Task<GalleryPhotoReadDto> UpdatePhotoAsync(int id, UpdateGalleryPhotoDto dto, CancellationToken ct = default);
    Task DeletePhotoAsync(int id, CancellationToken ct = default);
}
