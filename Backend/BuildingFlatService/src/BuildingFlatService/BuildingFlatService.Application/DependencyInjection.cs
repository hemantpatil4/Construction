using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using BuildingFlatService.Application.Interfaces;
using BuildingFlatService.Application.Mappings;
using BuildingFlatService.Application.Services;

namespace BuildingFlatService.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // AutoMapper
        services.AddAutoMapper(typeof(BuildingFlatMappingProfile).Assembly);

        // FluentValidation
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        // Application services
        services.AddScoped<IBuildingService, BuildingServiceImpl>();
        services.AddScoped<IFlatService, FlatServiceImpl>();
        services.AddScoped<IGalleryService, GalleryServiceImpl>();

        return services;
    }
}
