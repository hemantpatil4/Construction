using AuthService.Application.DTOs;

namespace AuthService.Application.Interfaces;

public interface IUserManagementService
{
    Task<IEnumerable<UserReadDto>> GetAllUsersAsync(CancellationToken cancellationToken = default);
    Task<UserReadDto> GetUserByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<UserReadDto> UpdateUserRoleAsync(int id, UpdateUserRoleDto request, CancellationToken cancellationToken = default);
    Task DeleteUserAsync(int id, CancellationToken cancellationToken = default);
}
