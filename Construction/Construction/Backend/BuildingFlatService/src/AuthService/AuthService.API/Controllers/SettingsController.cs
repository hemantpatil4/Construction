using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;
    private readonly ILogger<SettingsController> _logger;

    public SettingsController(ISettingsService settingsService, ILogger<SettingsController> logger)
    {
        _settingsService = settingsService;
        _logger = logger;
    }

    /// <summary>
    /// Get all settings. Public — needed by frontend on load.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<SettingReadDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var settings = await _settingsService.GetAllAsync(cancellationToken);
        return Ok(settings);
    }

    /// <summary>
    /// Get a single setting by key. Public.
    /// </summary>
    [HttpGet("{key}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SettingReadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByKey(string key, CancellationToken cancellationToken)
    {
        var setting = await _settingsService.GetByKeyAsync(key, cancellationToken);
        if (setting is null)
            return NotFound(new { message = $"Setting '{key}' not found." });
        return Ok(setting);
    }

    /// <summary>
    /// Update a setting. Admin only.
    /// </summary>
    [HttpPut("{key}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(SettingReadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(string key, [FromBody] SettingUpdateDto request, CancellationToken cancellationToken)
    {
        var updated = await _settingsService.UpdateAsync(key, request, cancellationToken);
        return Ok(updated);
    }
}
