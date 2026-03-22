using BuildingFlatService.Domain.Entities;
using BuildingFlatService.Domain.Interfaces;
using BuildingFlatService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BuildingFlatService.Infrastructure.Repositories;

public class BuildingRepository : IBuildingRepository
{
    private readonly BuildingFlatDbContext _context;

    public BuildingRepository(BuildingFlatDbContext context)
    {
        _context = context;
    }

    public async Task<Building?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        => await _context.Buildings.FindAsync(new object[] { id }, cancellationToken);

    public async Task<Building?> GetByIdWithFlatsAsync(int id, CancellationToken cancellationToken = default)
        => await _context.Buildings
            .Include(b => b.Flats)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

    public async Task<IEnumerable<Building>> GetAllAsync(CancellationToken cancellationToken = default)
        => await _context.Buildings
            .Include(b => b.Flats)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<Building> AddAsync(Building building, CancellationToken cancellationToken = default)
    {
        await _context.Buildings.AddAsync(building, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return building;
    }

    public async Task UpdateAsync(Building building, CancellationToken cancellationToken = default)
    {
        _context.Buildings.Update(building);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Building building, CancellationToken cancellationToken = default)
    {
        _context.Buildings.Remove(building);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default)
        => await _context.Buildings.AnyAsync(b => b.Id == id, cancellationToken);
}
