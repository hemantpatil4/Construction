using AutoMapper;
using FluentValidation;
using Microsoft.Extensions.Logging;
using BuildingFlatService.Application.DTOs.Flat;
using BuildingFlatService.Application.Exceptions;
using BuildingFlatService.Application.Interfaces;
using BuildingFlatService.Domain.Entities;
using BuildingFlatService.Domain.Interfaces;
using ValidationException = BuildingFlatService.Application.Exceptions.ValidationException;

namespace BuildingFlatService.Application.Services;

public class FlatServiceImpl : IFlatService
{
    private readonly IFlatRepository _flatRepository;
    private readonly IBuildingRepository _buildingRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<FlatServiceImpl> _logger;
    private readonly IValidator<CreateFlatDto> _createValidator;
    private readonly IValidator<UpdateFlatDto> _updateValidator;

    public FlatServiceImpl(
        IFlatRepository flatRepository,
        IBuildingRepository buildingRepository,
        IMapper mapper,
        ILogger<FlatServiceImpl> logger,
        IValidator<CreateFlatDto> createValidator,
        IValidator<UpdateFlatDto> updateValidator)
    {
        _flatRepository = flatRepository;
        _buildingRepository = buildingRepository;
        _mapper = mapper;
        _logger = logger;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<IEnumerable<FlatReadDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Fetching all flats.");
        var flats = await _flatRepository.GetAllAsync(cancellationToken);
        return _mapper.Map<IEnumerable<FlatReadDto>>(flats);
    }

    public async Task<FlatReadDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Fetching flat with Id: {FlatId}", id);

        var flat = await _flatRepository.GetByIdAsync(id, cancellationToken);
        if (flat is null)
            throw new NotFoundException(nameof(Flat), id);

        return _mapper.Map<FlatReadDto>(flat);
    }

    public async Task<IEnumerable<FlatReadDto>> GetByBuildingIdAsync(int buildingId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Fetching flats for building Id: {BuildingId}", buildingId);

        if (!await _buildingRepository.ExistsAsync(buildingId, cancellationToken))
            throw new NotFoundException(nameof(Building), buildingId);

        var flats = await _flatRepository.GetByBuildingIdAsync(buildingId, cancellationToken);
        return _mapper.Map<IEnumerable<FlatReadDto>>(flats);
    }

    public async Task<FlatReadDto> CreateAsync(CreateFlatDto dto, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating flat: {FlatNumber} in building: {BuildingId}", dto.FlatNumber, dto.BuildingId);

        var validationResult = await _createValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            throw new ValidationException(errors);
        }

        // Verify the building exists
        if (!await _buildingRepository.ExistsAsync(dto.BuildingId, cancellationToken))
            throw new NotFoundException(nameof(Building), dto.BuildingId);

        var flat = _mapper.Map<Flat>(dto);
        flat.CreatedAt = DateTime.UtcNow;

        var created = await _flatRepository.AddAsync(flat, cancellationToken);

        _logger.LogInformation("Flat created successfully with Id: {FlatId}", created.Id);

        // Reload with navigation property for mapping
        var reloaded = await _flatRepository.GetByIdAsync(created.Id, cancellationToken);
        return _mapper.Map<FlatReadDto>(reloaded);
    }

    public async Task UpdateAsync(int id, UpdateFlatDto dto, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating flat with Id: {FlatId}", id);

        var validationResult = await _updateValidator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            throw new ValidationException(errors);
        }

        var flat = await _flatRepository.GetByIdAsync(id, cancellationToken);
        if (flat is null)
            throw new NotFoundException(nameof(Flat), id);

        if (!await _buildingRepository.ExistsAsync(dto.BuildingId, cancellationToken))
            throw new NotFoundException(nameof(Building), dto.BuildingId);

        _mapper.Map(dto, flat);
        await _flatRepository.UpdateAsync(flat, cancellationToken);

        _logger.LogInformation("Flat updated successfully: {FlatId}", id);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting flat with Id: {FlatId}", id);

        var flat = await _flatRepository.GetByIdAsync(id, cancellationToken);
        if (flat is null)
            throw new NotFoundException(nameof(Flat), id);

        await _flatRepository.DeleteAsync(flat, cancellationToken);

        _logger.LogInformation("Flat deleted successfully: {FlatId}", id);
    }
}
