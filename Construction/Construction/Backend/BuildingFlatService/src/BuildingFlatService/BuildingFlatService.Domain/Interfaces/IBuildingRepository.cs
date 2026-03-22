using BuildingFlatService.Domain.Entities;

namespace BuildingFlatService.Domain.Interfaces;

public interface IBuildingRepository
{
    Task<Building?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Building?> GetByIdWithFlatsAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Building>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Building> AddAsync(Building building, CancellationToken cancellationToken = default);
    Task UpdateAsync(Building building, CancellationToken cancellationToken = default);
    Task DeleteAsync(Building building, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default);
}
