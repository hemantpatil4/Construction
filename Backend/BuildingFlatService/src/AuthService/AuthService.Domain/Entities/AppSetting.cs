namespace AuthService.Domain.Entities;

/// <summary>
/// Generic key-value settings table. Expandable for future settings.
/// </summary>
public class AppSetting
{
    public int Id { get; set; }

    /// <summary>Unique setting key, e.g. "AppName", "MaintenanceMode", "MaxUploadSizeMB".</summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>Setting value stored as string. Parse as needed.</summary>
    public string Value { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
