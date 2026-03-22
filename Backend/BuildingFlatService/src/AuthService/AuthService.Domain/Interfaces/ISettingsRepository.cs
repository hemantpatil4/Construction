using AuthService.Domain.Entities;

namespace AuthService.Domain.Interfaces;

public interface ISettingsRepository
{
    Task<IEnumerable<AppSetting>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<AppSetting?> GetByKeyAsync(string key, CancellationToken cancellationToken = default);
    Task<AppSetting> UpsertAsync(string key, string value, CancellationToken cancellationToken = default);
}
