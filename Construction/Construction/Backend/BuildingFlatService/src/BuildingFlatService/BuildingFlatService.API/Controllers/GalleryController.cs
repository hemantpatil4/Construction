using BuildingFlatService.Application.DTOs.Gallery;
using BuildingFlatService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BuildingFlatService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GalleryController : ControllerBase
{
    private readonly IGalleryService _service;

    public GalleryController(IGalleryService service)
    {
        _service = service;
    }

    // ═══════════════════════════════════════════════════════════
    //  SECTIONS — Public read, Admin write
    // ═══════════════════════════════════════════════════════════

    /// <summary>Get all gallery sections (public)</summary>
    [HttpGet("sections")]
    public async Task<IActionResult> GetAllSections([FromQuery] bool includeInactive = false, CancellationToken ct = default)
    {
        var sections = await _service.GetAllSectionsAsync(includeInactive, ct);
        return Ok(sections);
    }

    /// <summary>Get section by ID with photos (public)</summary>
    [HttpGet("sections/{id}")]
    public async Task<IActionResult> GetSectionById(int id, CancellationToken ct)
    {
        var section = await _service.GetSectionByIdAsync(id, ct);
        if (section == null) return NotFound();
        return Ok(section);
    }

    /// <summary>Create a new section (Admin only)</summary>
    [HttpPost("sections")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateSection([FromBody] CreateGallerySectionDto dto, CancellationToken ct)
    {
        var created = await _service.CreateSectionAsync(dto, ct);
        return CreatedAtAction(nameof(GetSectionById), new { id = created.Id }, created);
    }

    /// <summary>Update a section (Admin only)</summary>
    [HttpPut("sections/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateSection(int id, [FromBody] UpdateGallerySectionDto dto, CancellationToken ct)
    {
        try
        {
            var updated = await _service.UpdateSectionAsync(id, dto, ct);
            return Ok(updated);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>Delete a section (Admin only)</summary>
    [HttpDelete("sections/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteSection(int id, CancellationToken ct)
    {
        await _service.DeleteSectionAsync(id, ct);
        return NoContent();
    }

    // ═══════════════════════════════════════════════════════════
    //  PHOTOS — Public read, Admin write
    // ═══════════════════════════════════════════════════════════

    /// <summary>Get all photos (public)</summary>
    [HttpGet("photos")]
    public async Task<IActionResult> GetAllPhotos([FromQuery] bool includeInactive = false, CancellationToken ct = default)
    {
        var photos = await _service.GetAllPhotosAsync(includeInactive, ct);
        return Ok(photos);
    }

    /// <summary>Get general portfolio photos (not linked to any building)</summary>
    [HttpGet("photos/general")]
    public async Task<IActionResult> GetGeneralPhotos(CancellationToken ct)
    {
        var photos = await _service.GetGeneralPhotosAsync(ct);
        return Ok(photos);
    }

    /// <summary>Get photos by section</summary>
    [HttpGet("photos/section/{sectionId}")]
    public async Task<IActionResult> GetPhotosBySection(int sectionId, CancellationToken ct)
    {
        var photos = await _service.GetPhotosBySectionAsync(sectionId, ct);
        return Ok(photos);
    }

    /// <summary>Get photos by building</summary>
    [HttpGet("photos/building/{buildingId}")]
    public async Task<IActionResult> GetPhotosByBuilding(int buildingId, CancellationToken ct)
    {
        var photos = await _service.GetPhotosByBuildingAsync(buildingId, ct);
        return Ok(photos);
    }

    /// <summary>Get photo by ID</summary>
    [HttpGet("photos/{id}")]
    public async Task<IActionResult> GetPhotoById(int id, CancellationToken ct)
    {
        var photo = await _service.GetPhotoByIdAsync(id, ct);
        if (photo == null) return NotFound();
        return Ok(photo);
    }

    /// <summary>Create a new photo (Admin only)</summary>
    [HttpPost("photos")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreatePhoto([FromBody] CreateGalleryPhotoDto dto, CancellationToken ct)
    {
        var created = await _service.CreatePhotoAsync(dto, ct);
        return CreatedAtAction(nameof(GetPhotoById), new { id = created.Id }, created);
    }

    /// <summary>Update a photo (Admin only)</summary>
    [HttpPut("photos/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdatePhoto(int id, [FromBody] UpdateGalleryPhotoDto dto, CancellationToken ct)
    {
        try
        {
            var updated = await _service.UpdatePhotoAsync(id, dto, ct);
            return Ok(updated);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>Delete a photo (Admin only)</summary>
    [HttpDelete("photos/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePhoto(int id, CancellationToken ct)
    {
        await _service.DeletePhotoAsync(id, ct);
        return NoContent();
    }
}
