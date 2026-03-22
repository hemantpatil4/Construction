using AutoMapper;
using BuildingFlatService.Application.DTOs.Gallery;
using BuildingFlatService.Application.Interfaces;
using BuildingFlatService.Domain.Entities;
using BuildingFlatService.Domain.Interfaces;

namespace BuildingFlatService.Application.Services;

public class GalleryServiceImpl : IGalleryService
{
    private readonly IGalleryRepository _repository;
    private readonly IMapper _mapper;

    public GalleryServiceImpl(IGalleryRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    // ═══════════════════════════════════════════════════════════
    //  SECTIONS
    // ═══════════════════════════════════════════════════════════

    public async Task<IEnumerable<GallerySectionReadDto>> GetAllSectionsAsync(bool includeInactive = false, CancellationToken ct = default)
    {
        var sections = await _repository.GetAllSectionsAsync(includeInactive, ct);
        return sections.Select(s => new GallerySectionReadDto
        {
            Id = s.Id,
            Name = s.Name,
            Description = s.Description,
            DisplayOrder = s.DisplayOrder,
            IsActive = s.IsActive,
            CreatedAt = s.CreatedAt,
            PhotoCount = s.Photos.Count
        });
    }

    public async Task<GallerySectionDetailDto?> GetSectionByIdAsync(int id, CancellationToken ct = default)
    {
        var section = await _repository.GetSectionByIdAsync(id, ct);
        if (section == null) return null;

        return new GallerySectionDetailDto
        {
            Id = section.Id,
            Name = section.Name,
            Description = section.Description,
            DisplayOrder = section.DisplayOrder,
            IsActive = section.IsActive,
            CreatedAt = section.CreatedAt,
            Photos = section.Photos.Select(p => new GalleryPhotoReadDto
            {
                Id = p.Id,
                Title = p.Title,
                Description = p.Description,
                ImageUrl = p.ImageUrl,
                ThumbnailUrl = p.ThumbnailUrl,
                DisplayOrder = p.DisplayOrder,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                SectionId = p.SectionId,
                SectionName = section.Name,
                BuildingId = p.BuildingId,
                BuildingName = p.Building?.Name
            }).ToList()
        };
    }

    public async Task<GallerySectionReadDto> CreateSectionAsync(CreateGallerySectionDto dto, CancellationToken ct = default)
    {
        var section = new GallerySection
        {
            Name = dto.Name,
            Description = dto.Description,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive
        };
        var created = await _repository.CreateSectionAsync(section, ct);
        return new GallerySectionReadDto
        {
            Id = created.Id,
            Name = created.Name,
            Description = created.Description,
            DisplayOrder = created.DisplayOrder,
            IsActive = created.IsActive,
            CreatedAt = created.CreatedAt,
            PhotoCount = 0
        };
    }

    public async Task<GallerySectionReadDto> UpdateSectionAsync(int id, UpdateGallerySectionDto dto, CancellationToken ct = default)
    {
        var section = await _repository.GetSectionByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Section with ID {id} not found");

        section.Name = dto.Name;
        section.Description = dto.Description;
        section.DisplayOrder = dto.DisplayOrder;
        section.IsActive = dto.IsActive;

        var updated = await _repository.UpdateSectionAsync(section, ct);
        return new GallerySectionReadDto
        {
            Id = updated.Id,
            Name = updated.Name,
            Description = updated.Description,
            DisplayOrder = updated.DisplayOrder,
            IsActive = updated.IsActive,
            CreatedAt = updated.CreatedAt,
            PhotoCount = updated.Photos.Count
        };
    }

    public async Task DeleteSectionAsync(int id, CancellationToken ct = default)
    {
        await _repository.DeleteSectionAsync(id, ct);
    }

    // ═══════════════════════════════════════════════════════════
    //  PHOTOS
    // ═══════════════════════════════════════════════════════════

    public async Task<IEnumerable<GalleryPhotoReadDto>> GetAllPhotosAsync(bool includeInactive = false, CancellationToken ct = default)
    {
        var photos = await _repository.GetAllPhotosAsync(includeInactive, ct);
        return photos.Select(MapPhotoToDto);
    }

    public async Task<IEnumerable<GalleryPhotoReadDto>> GetPhotosBySectionAsync(int sectionId, CancellationToken ct = default)
    {
        var photos = await _repository.GetPhotosBySectionAsync(sectionId, ct);
        return photos.Select(MapPhotoToDto);
    }

    public async Task<IEnumerable<GalleryPhotoReadDto>> GetPhotosByBuildingAsync(int buildingId, CancellationToken ct = default)
    {
        var photos = await _repository.GetPhotosByBuildingAsync(buildingId, ct);
        return photos.Select(MapPhotoToDto);
    }

    public async Task<IEnumerable<GalleryPhotoReadDto>> GetGeneralPhotosAsync(CancellationToken ct = default)
    {
        var photos = await _repository.GetGeneralPhotosAsync(ct);
        return photos.Select(MapPhotoToDto);
    }

    public async Task<GalleryPhotoReadDto?> GetPhotoByIdAsync(int id, CancellationToken ct = default)
    {
        var photo = await _repository.GetPhotoByIdAsync(id, ct);
        return photo == null ? null : MapPhotoToDto(photo);
    }

    public async Task<GalleryPhotoReadDto> CreatePhotoAsync(CreateGalleryPhotoDto dto, CancellationToken ct = default)
    {
        var photo = new GalleryPhoto
        {
            Title = dto.Title,
            Description = dto.Description,
            ImageUrl = dto.ImageUrl,
            ThumbnailUrl = dto.ThumbnailUrl,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive,
            SectionId = dto.SectionId,
            BuildingId = dto.BuildingId
        };
        var created = await _repository.CreatePhotoAsync(photo, ct);

        // Reload to get navigation properties
        var reloaded = await _repository.GetPhotoByIdAsync(created.Id, ct);
        return MapPhotoToDto(reloaded!);
    }

    public async Task<GalleryPhotoReadDto> UpdatePhotoAsync(int id, UpdateGalleryPhotoDto dto, CancellationToken ct = default)
    {
        var photo = await _repository.GetPhotoByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Photo with ID {id} not found");

        photo.Title = dto.Title;
        photo.Description = dto.Description;
        photo.ImageUrl = dto.ImageUrl;
        photo.ThumbnailUrl = dto.ThumbnailUrl;
        photo.DisplayOrder = dto.DisplayOrder;
        photo.IsActive = dto.IsActive;
        photo.SectionId = dto.SectionId;
        photo.BuildingId = dto.BuildingId;

        await _repository.UpdatePhotoAsync(photo, ct);

        // Reload to get updated navigation properties
        var reloaded = await _repository.GetPhotoByIdAsync(id, ct);
        return MapPhotoToDto(reloaded!);
    }

    public async Task DeletePhotoAsync(int id, CancellationToken ct = default)
    {
        await _repository.DeletePhotoAsync(id, ct);
    }

    // ─── Helper ───
    private static GalleryPhotoReadDto MapPhotoToDto(GalleryPhoto p) => new()
    {
        Id = p.Id,
        Title = p.Title,
        Description = p.Description,
        ImageUrl = p.ImageUrl,
        ThumbnailUrl = p.ThumbnailUrl,
        DisplayOrder = p.DisplayOrder,
        IsActive = p.IsActive,
        CreatedAt = p.CreatedAt,
        SectionId = p.SectionId,
        SectionName = p.Section?.Name ?? string.Empty,
        BuildingId = p.BuildingId,
        BuildingName = p.Building?.Name
    };
}
