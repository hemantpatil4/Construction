using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserManagementService _userManagementService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserManagementService userManagementService, ILogger<UsersController> logger)
    {
        _userManagementService = userManagementService;
        _logger = logger;
    }

    /// <summary>
    /// Get all users. Admin only.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UserReadDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var users = await _userManagementService.GetAllUsersAsync(cancellationToken);
        return Ok(users);
    }

    /// <summary>
    /// Get a single user by Id. Admin only.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(UserReadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var user = await _userManagementService.GetUserByIdAsync(id, cancellationToken);
        return Ok(user);
    }

    /// <summary>
    /// Update a user's role. Admin only.
    /// </summary>
    [HttpPut("{id:int}/role")]
    [ProducesResponseType(typeof(UserReadDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateUserRoleDto request, CancellationToken cancellationToken)
    {
        var user = await _userManagementService.UpdateUserRoleAsync(id, request, cancellationToken);
        return Ok(user);
    }

    /// <summary>
    /// Delete a user. Admin only.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _userManagementService.DeleteUserAsync(id, cancellationToken);
        return NoContent();
    }
}
