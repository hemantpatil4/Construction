using BuildingFlatService.Domain.Entities;
using BuildingFlatService.Domain.Interfaces;
using BuildingFlatService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildingFlatService.Infrastructure.Repositories;

public class GalleryRepository : IGalleryRepository
{
    private readonly BuildingFlatDbContext _context;

    public GalleryRepository(BuildingFlatDbContext context)
    {
        _context = context;
    }

    // ═══════════════════════════════════════════════════════════
    //  SECTIONS
    // ═══════════════════════════════════════════════════════════

    public async Task<IEnumerable<GallerySection>> GetAllSectionsAsync(bool includeInactive = false, CancellationToken ct = default)
    {
        var query = _context.GallerySections
            .Include(s => s.Photos.Where(p => p.IsActive))
            .OrderBy(s => s.DisplayOrder)
            .ThenBy(s => s.Name)
            .AsQueryable();

        if (!includeInactive)
            query = query.Where(s => s.IsActive);

        return await query.ToListAsync(ct);
    }

    public async Task<GallerySection?> GetSectionByIdAsync(int id, CancellationToken ct = default)
    {
        return await _context.GallerySections
            .Include(s => s.Photos)
            .FirstOrDefaultAsync(s => s.Id == id, ct);
    }

    public async Task<GallerySection> CreateSectionAsync(GallerySection section, CancellationToken ct = default)
    {
        _context.GallerySections.Add(section);
        await _context.SaveChangesAsync(ct);
        return section;
    }

    public async Task<GallerySection> UpdateSectionAsync(GallerySection section, CancellationToken ct = default)
    {
        _context.GallerySections.Update(section);
        await _context.SaveChangesAsync(ct);
        return section;
    }

    public async Task DeleteSectionAsync(int id, CancellationToken ct = default)
    {
        var section = await _context.GallerySections.FindAsync(new object[] { id }, ct);
        if (section != null)
        {
            _context.GallerySections.Remove(section);
            await _context.SaveChangesAsync(ct);
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  PHOTOS
    // ═══════════════════════════════════════════════════════════

    public async Task<IEnumerable<GalleryPhoto>> GetAllPhotosAsync(bool includeInactive = false, CancellationToken ct = default)
    {
        var query = _context.GalleryPhotos
            .Include(p => p.Section)
            .Include(p => p.Building)
            .OrderBy(p => p.SectionId)
            .ThenBy(p => p.DisplayOrder)
            .AsQueryable();

        if (!includeInactive)
            query = query.Where(p => p.IsActive);

        return await query.ToListAsync(ct);
    }

    public async Task<IEnumerable<GalleryPhoto>> GetPhotosBySectionAsync(int sectionId, CancellationToken ct = default)
    {
        return await _context.GalleryPhotos
            .Include(p => p.Building)
            .Where(p => p.SectionId == sectionId && p.IsActive)
            .OrderBy(p => p.DisplayOrder)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<GalleryPhoto>> GetPhotosByBuildingAsync(int buildingId, CancellationToken ct = default)
    {
        return await _context.GalleryPhotos
            .Include(p => p.Section)
            .Where(p => p.BuildingId == buildingId && p.IsActive)
            .OrderBy(p => p.DisplayOrder)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<GalleryPhoto>> GetGeneralPhotosAsync(CancellationToken ct = default)
    {
        return await _context.GalleryPhotos
            .Include(p => p.Section)
            .Where(p => p.BuildingId == null && p.IsActive)
            .OrderBy(p => p.SectionId)
            .ThenBy(p => p.DisplayOrder)
            .ToListAsync(ct);
    }

    public async Task<GalleryPhoto?> GetPhotoByIdAsync(int id, CancellationToken ct = default)
    {
        return await _context.GalleryPhotos
            .Include(p => p.Section)
            .Include(p => p.Building)
            .FirstOrDefaultAsync(p => p.Id == id, ct);
    }

    public async Task<GalleryPhoto> CreatePhotoAsync(GalleryPhoto photo, CancellationToken ct = default)
    {
        _context.GalleryPhotos.Add(photo);
        await _context.SaveChangesAsync(ct);
        return photo;
    }

    public async Task<GalleryPhoto> UpdatePhotoAsync(GalleryPhoto photo, CancellationToken ct = default)
    {
        _context.GalleryPhotos.Update(photo);
        await _context.SaveChangesAsync(ct);
        return photo;
    }

    public async Task DeletePhotoAsync(int id, CancellationToken ct = default)
    {
        var photo = await _context.GalleryPhotos.FindAsync(new object[] { id }, ct);
        if (photo != null)
        {
            _context.GalleryPhotos.Remove(photo);
            await _context.SaveChangesAsync(ct);
        }
    }
}
