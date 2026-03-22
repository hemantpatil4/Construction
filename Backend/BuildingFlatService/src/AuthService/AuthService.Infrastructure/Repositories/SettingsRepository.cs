using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using AuthService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Infrastructure.Repositories;

public class SettingsRepository : ISettingsRepository
{
    private readonly AuthDbContext _context;

    public SettingsRepository(AuthDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<AppSetting>> GetAllAsync(CancellationToken cancellationToken = default)
        => await _context.Settings.AsNoTracking().OrderBy(s => s.Key).ToListAsync(cancellationToken);

    public async Task<AppSetting?> GetByKeyAsync(string key, CancellationToken cancellationToken = default)
        => await _context.Settings.FirstOrDefaultAsync(s => s.Key == key, cancellationToken);

    public async Task<AppSetting> UpsertAsync(string key, string value, CancellationToken cancellationToken = default)
    {
        var existing = await _context.Settings.FirstOrDefaultAsync(s => s.Key == key, cancellationToken);

        if (existing is not null)
        {
            existing.Value = value;
            existing.UpdatedAt = DateTime.UtcNow;
            _context.Settings.Update(existing);
        }
        else
        {
            existing = new AppSetting
            {
                Key = key,
                Value = value,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Settings.Add(existing);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return existing;
    }
}
