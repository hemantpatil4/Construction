using AutoMapper;
using FluentValidation;
using Microsoft.Extensions.Logging;
using BuildingFlatService.Application.DTOs.Building;
using BuildingFlatService.Application.Exceptions;
using BuildingFlatService.Application.Interfaces;
using BuildingFlatService.Domain.Entities;
using BuildingFlatService.Domain.Interfaces;
using ValidationException = BuildingFlatService.Application.Exceptions.ValidationException;

namespace BuildingFlatService.Application.Services;

public class BuildingServiceImpl : IBuildingService
{
    private readonly IBuildingRepository _buildingRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<BuildingServiceImpl> _logger;
    private readonly IValidator<CreateBuildingDto> _createValidator;
    private readonly IValidator<UpdateBuildingDto> _updateValidator;

    public BuildingServiceImpl(
        IBuildingRepository buildingRepository,
        IMapper mapper,
        ILogger<BuildingServiceImpl> logger,
        IValidator<CreateBuildingDto> createValidator,
        IValidator<UpdateBuildingDto> updateValidator)
    {
        _buildingRepository = buildingRepository;
        _mapper = mapper;
        _logger = logger;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<IEnumerable<BuildingReadDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Fetching all buildings.");
        var buildings = await _buildingRepository.GetAllAsync(cancellationToken);
        return _mapper.Map<IEnumerable<BuildingReadDto>>(buildings);
    }

    public async Task<BuildingDetailDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Fetching building with Id: {BuildingId}", id);

        var building = await _buildingRepository.GetByIdWithFlatsAsync(id, cancellationToken);
        if (building is null)
            throw new NotFoundException(nameof(Building), id);

        return _mapper.Map<BuildingDetailDto>(building);
    }

    public async Task<BuildingReadDto> CreateAsync(CreateBuildingDto dto, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating new building: {BuildingName}", dto.Name);

        var validationResult = await _createValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            throw new ValidationException(errors);
        }

        var building = _mapper.Map<Building>(dto);
        building.CreatedAt = DateTime.UtcNow;

        var created = await _buildingRepository.AddAsync(building, cancellationToken);

        _logger.LogInformation("Building created successfully with Id: {BuildingId}", created.Id);

        return _mapper.Map<BuildingReadDto>(created);
    }

    public async Task UpdateAsync(int id, UpdateBuildingDto dto, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating building with Id: {BuildingId}", id);

        var validationResult = await _updateValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            throw new ValidationException(errors);
        }

        var building = await _buildingRepository.GetByIdAsync(id, cancellationToken);
        if (building is null)
            throw new NotFoundException(nameof(Building), id);

        _mapper.Map(dto, building);
        await _buildingRepository.UpdateAsync(building, cancellationToken);

        _logger.LogInformation("Building updated successfully: {BuildingId}", id);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting building with Id: {BuildingId}", id);

        var building = await _buildingRepository.GetByIdAsync(id, cancellationToken);
        if (building is null)
            throw new NotFoundException(nameof(Building), id);

        await _buildingRepository.DeleteAsync(building, cancellationToken);

        _logger.LogInformation("Building deleted successfully: {BuildingId}", id);
    }
}
