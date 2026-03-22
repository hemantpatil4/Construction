namespace AuthService.Application.DTOs;

public class SettingReadDto
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}

public class SettingUpdateDto
{
    public string Value { get; set; } = string.Empty;
}
