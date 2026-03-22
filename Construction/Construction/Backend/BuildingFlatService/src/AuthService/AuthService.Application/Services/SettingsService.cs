using AuthService.Application.DTOs;
using AuthService.Application.Exceptions;
using AuthService.Application.Interfaces;
using AuthService.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace AuthService.Application.Services;

public class SettingsService : ISettingsService
{
    private readonly ISettingsRepository _repo;
    private readonly ILogger<SettingsService> _logger;

    public SettingsService(ISettingsRepository repo, ILogger<SettingsService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<IEnumerable<SettingReadDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var settings = await _repo.GetAllAsync(cancellationToken);
        return settings.Select(s => new SettingReadDto
        {
            Key = s.Key,
            Value = s.Value,
            UpdatedAt = s.UpdatedAt
        });
    }

    public async Task<SettingReadDto?> GetByKeyAsync(string key, CancellationToken cancellationToken = default)
    {
        var setting = await _repo.GetByKeyAsync(key, cancellationToken);
        if (setting is null) return null;

        return new SettingReadDto
        {
            Key = setting.Key,
            Value = setting.Value,
            UpdatedAt = setting.UpdatedAt
        };
    }

    public async Task<SettingReadDto> UpdateAsync(string key, SettingUpdateDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Value))
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { "Value", new[] { "Setting value cannot be empty." } }
            });

        _logger.LogInformation("Updating setting '{Key}' to '{Value}'", key, request.Value);

        var updated = await _repo.UpsertAsync(key, request.Value.Trim(), cancellationToken);

        return new SettingReadDto
        {
            Key = updated.Key,
            Value = updated.Value,
            UpdatedAt = updated.UpdatedAt
        };
    }
}
