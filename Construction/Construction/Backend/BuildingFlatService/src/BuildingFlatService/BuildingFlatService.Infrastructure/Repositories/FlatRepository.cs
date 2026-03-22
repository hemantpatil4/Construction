using BuildingFlatService.Domain.Entities;
using BuildingFlatService.Domain.Interfaces;
using BuildingFlatService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildingFlatService.Infrastructure.Repositories;

public class FlatRepository : IFlatRepository
{
    private readonly BuildingFlatDbContext _context;

    public FlatRepository(BuildingFlatDbContext context)
    {
        _context = context;
    }

    public async Task<Flat?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        => await _context.Flats
            .Include(f => f.Building)
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);

    public async Task<IEnumerable<Flat>> GetAllAsync(CancellationToken cancellationToken = default)
        => await _context.Flats
            .Include(f => f.Building)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<IEnumerable<Flat>> GetByBuildingIdAsync(int buildingId, CancellationToken cancellationToken = default)
        => await _context.Flats
            .Include(f => f.Building)
            .Where(f => f.BuildingId == buildingId)
            .OrderBy(f => f.FlatNumber)
            .ToListAsync(cancellationToken);

    public async Task<Flat> AddAsync(Flat flat, CancellationToken cancellationToken = default)
    {
        await _context.Flats.AddAsync(flat, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return flat;
    }

    public async Task UpdateAsync(Flat flat, CancellationToken cancellationToken = default)
    {
        _context.Flats.Update(flat);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Flat flat, CancellationToken cancellationToken = default)
    {
        _context.Flats.Remove(flat);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default)
        => await _context.Flats.AnyAsync(f => f.Id == id, cancellationToken);
}
