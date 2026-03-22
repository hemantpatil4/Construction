using AuthService.Domain.Entities;

namespace AuthService.Domain.Interfaces;

/// <summary>
/// Repository abstraction for AppUser persistence operations.
/// </summary>
public interface IUserRepository
{
    Task<AppUser?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<AppUser?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<AppUser?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<IEnumerable<AppUser>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<AppUser> AddAsync(AppUser user, CancellationToken cancellationToken = default);
    Task UpdateAsync(AppUser user, CancellationToken cancellationToken = default);
    Task DeleteAsync(AppUser user, CancellationToken cancellationToken = default);
    Task<bool> ExistsByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default);
}
