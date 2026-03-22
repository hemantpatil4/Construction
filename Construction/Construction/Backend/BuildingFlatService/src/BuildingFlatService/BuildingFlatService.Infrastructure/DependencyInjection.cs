using BuildingFlatService.Domain.Interfaces;
using BuildingFlatService.Infrastructure.Persistence;
using BuildingFlatService.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingFlatService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // DbContext with retry on transient failures
        services.AddDbContext<BuildingFlatDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("BuildingFlatDb"),
                sqlOptions =>
                {
                    sqlOptions.MigrationsAssembly(typeof(BuildingFlatDbContext).Assembly.FullName);
                    sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(30),
                        errorNumbersToAdd: null);
                }));

        // Repositories
        services.AddScoped<IBuildingRepository, BuildingRepository>();
        services.AddScoped<IFlatRepository, FlatRepository>();
        services.AddScoped<IGalleryRepository, GalleryRepository>();

        return services;
    }
}
