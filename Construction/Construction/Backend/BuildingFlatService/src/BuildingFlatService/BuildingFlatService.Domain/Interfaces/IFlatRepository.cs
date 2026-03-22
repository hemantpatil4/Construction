using BuildingFlatService.Domain.Entities;

namespace BuildingFlatService.Domain.Interfaces;

public interface IFlatRepository
{
    Task<Flat?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Flat>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Flat>> GetByBuildingIdAsync(int buildingId, CancellationToken cancellationToken = default);
    Task<Flat> AddAsync(Flat flat, CancellationToken cancellationToken = default);
    Task UpdateAsync(Flat flat, CancellationToken cancellationToken = default);
    Task DeleteAsync(Flat flat, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default);
}
