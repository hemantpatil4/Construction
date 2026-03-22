using BuildingFlatService.Application.DTOs.Flat;
using BuildingFlatService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildingFlatService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FlatsController : ControllerBase
{
    private readonly IFlatService _flatService;
    private readonly ILogger<FlatsController> _logger;

    public FlatsController(IFlatService flatService, ILogger<FlatsController> logger)
    {
        _flatService = flatService;
        _logger = logger;
    }

    /// <summary>
    /// Get all flats. Accessible by Admin and User.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,User")]
    [ProducesResponseType(typeof(IEnumerable<FlatReadDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var flats = await _flatService.GetAllAsync(cancellationToken);
        return Ok(flats);
    }

    /// <summary>
    /// Get flat by Id. Accessible by Admin and User.
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,User")]
    [ProducesResponseType(typeof(FlatReadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var flat = await _flatService.GetByIdAsync(id, cancellationToken);
        return Ok(flat);
    }

    /// <summary>
    /// Get all flats for a specific building. Accessible by Admin and User.
    /// </summary>
    [HttpGet("building/{buildingId:int}")]
    [Authorize(Roles = "Admin,User")]
    [ProducesResponseType(typeof(IEnumerable<FlatReadDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByBuildingId(int buildingId, CancellationToken cancellationToken)
    {
        var flats = await _flatService.GetByBuildingIdAsync(buildingId, cancellationToken);
        return Ok(flats);
    }

    /// <summary>
    /// Create a new flat. Admin only.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(FlatReadDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] CreateFlatDto dto, CancellationToken cancellationToken)
    {
        var flat = await _flatService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = flat.Id }, flat);
    }

    /// <summary>
    /// Update an existing flat. Admin only.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateFlatDto dto, CancellationToken cancellationToken)
    {
        await _flatService.UpdateAsync(id, dto, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Delete a flat. Admin only.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _flatService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
