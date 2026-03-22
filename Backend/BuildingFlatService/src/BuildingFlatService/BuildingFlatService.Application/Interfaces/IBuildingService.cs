using BuildingFlatService.Application.DTOs.Building;

namespace BuildingFlatService.Application.Interfaces;

public interface IBuildingService
{
    Task<IEnumerable<BuildingReadDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<BuildingDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<BuildingReadDto> CreateAsync(CreateBuildingDto dto, CancellationToken cancellationToken = default);
    Task UpdateAsync(int id, UpdateBuildingDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
