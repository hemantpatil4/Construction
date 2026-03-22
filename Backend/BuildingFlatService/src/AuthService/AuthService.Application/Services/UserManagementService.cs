using AutoMapper;
using Microsoft.Extensions.Logging;
using AuthService.Application.DTOs;
using AuthService.Application.Exceptions;
using AuthService.Application.Interfaces;
using AuthService.Domain.Interfaces;

namespace AuthService.Application.Services;

public class UserManagementService : IUserManagementService
{
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<UserManagementService> _logger;

    public UserManagementService(
        IUserRepository userRepository,
        IMapper mapper,
        ILogger<UserManagementService> logger)
    {
        _userRepository = userRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<IEnumerable<UserReadDto>> GetAllUsersAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Fetching all users");
        var users = await _userRepository.GetAllAsync(cancellationToken);
        return _mapper.Map<IEnumerable<UserReadDto>>(users);
    }

    public async Task<UserReadDto> GetUserByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Fetching user with Id: {UserId}", id);
        var user = await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"User with Id {id} was not found.");
        return _mapper.Map<UserReadDto>(user);
    }

    public async Task<UserReadDto> UpdateUserRoleAsync(int id, UpdateUserRoleDto request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating role for user Id: {UserId} to {Role}", id, request.Role);

        var user = await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"User with Id {id} was not found.");

        user.Role = request.Role;
        await _userRepository.UpdateAsync(user, cancellationToken);

        _logger.LogInformation("User {Username} role updated to {Role}", user.Username, request.Role);
        return _mapper.Map<UserReadDto>(user);
    }

    public async Task DeleteUserAsync(int id, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting user with Id: {UserId}", id);

        var user = await _userRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"User with Id {id} was not found.");

        await _userRepository.DeleteAsync(user, cancellationToken);
        _logger.LogInformation("User {Username} (Id: {UserId}) deleted", user.Username, user.Id);
    }
}
