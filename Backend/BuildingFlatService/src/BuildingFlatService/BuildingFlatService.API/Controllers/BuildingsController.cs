using BuildingFlatService.Application.DTOs.Building;
using BuildingFlatService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildingFlatService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // All endpoints require authentication
public class BuildingsController : ControllerBase
{
    private readonly IBuildingService _buildingService;
    private readonly ILogger<BuildingsController> _logger;

    public BuildingsController(IBuildingService buildingService, ILogger<BuildingsController> logger)
    {
        _buildingService = buildingService;
        _logger = logger;
    }

    /// <summary>
    /// Get all buildings. Accessible by Admin and User.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,User")]
    [ProducesResponseType(typeof(IEnumerable<BuildingReadDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var buildings = await _buildingService.GetAllAsync(cancellationToken);
        return Ok(buildings);
    }

    /// <summary>
    /// Get building by Id (includes flats). Accessible by Admin and User.
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,User")]
    [ProducesResponseType(typeof(BuildingDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var building = await _buildingService.GetByIdAsync(id, cancellationToken);
        return Ok(building);
    }

    /// <summary>
    /// Create a new building. Admin only.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(BuildingReadDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] CreateBuildingDto dto, CancellationToken cancellationToken)
    {
        var building = await _buildingService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = building.Id }, building);
    }

    /// <summary>
    /// Update an existing building. Admin only.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBuildingDto dto, CancellationToken cancellationToken)
    {
        await _buildingService.UpdateAsync(id, dto, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Delete a building. Admin only.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _buildingService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
