using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs;

public class UpdateUserRoleDto
{
    [Required]
    [RegularExpression("^(Admin|User)$", ErrorMessage = "Role must be 'Admin' or 'User'.")]
    public string Role { get; set; } = string.Empty;
}
