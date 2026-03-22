using BuildingFlatService.Application.DTOs.Flat;

namespace BuildingFlatService.Application.Interfaces;

public interface IFlatService
{
    Task<IEnumerable<FlatReadDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<FlatReadDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<FlatReadDto>> GetByBuildingIdAsync(int buildingId, CancellationToken cancellationToken = default);
    Task<FlatReadDto> CreateAsync(CreateFlatDto dto, CancellationToken cancellationToken = default);
    Task UpdateAsync(int id, UpdateFlatDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
