using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using AuthService.Application.Interfaces;
using AuthService.Application.Mappings;
using AuthService.Application.Services;

namespace AuthService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // AutoMapper
        services.AddAutoMapper(typeof(AuthMappingProfile).Assembly);

        // FluentValidation — register all validators from this assembly
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        // Application services
        services.AddScoped<IAuthService, AuthServiceImpl>();
        services.AddScoped<IUserManagementService, UserManagementService>();
        services.AddScoped<ISettingsService, SettingsService>();

        return services;
    }
}
