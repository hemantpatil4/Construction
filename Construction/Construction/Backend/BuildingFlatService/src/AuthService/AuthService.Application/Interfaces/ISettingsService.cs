using AuthService.Application.DTOs;

namespace AuthService.Application.Interfaces;

public interface ISettingsService
{
    Task<IEnumerable<SettingReadDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<SettingReadDto?> GetByKeyAsync(string key, CancellationToken cancellationToken = default);
    Task<SettingReadDto> UpdateAsync(string key, SettingUpdateDto request, CancellationToken cancellationToken = default);
}
