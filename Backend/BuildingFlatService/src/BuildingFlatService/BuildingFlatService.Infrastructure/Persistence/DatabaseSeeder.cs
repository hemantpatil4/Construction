using BuildingFlatService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BuildingFlatService.Infrastructure.Persistence;

/// <summary>
/// Seeds the database with initial building and flat data matching
/// the Shivneri JSON configuration used by the parametric 3D viewer.
/// Only seeds when the database has no buildings (first run).
/// </summary>
public static class DatabaseSeeder
{
    public static async Task SeedAsync(BuildingFlatDbContext db, ILogger logger)
    {
        // Only seed Shivneri if it doesn't already exist
        if (await db.Buildings.AnyAsync(b => b.Name == "Shivneri - A Wing"))
        {
            logger.LogInformation("Shivneri - A Wing already exists — skipping seed.");
            return;
        }

        logger.LogInformation("Seeding database with Shivneri building data...");

        // ───── Building: Shivneri - A Wing ─────
        var building = new Building
        {
            Name = "Shivneri - A Wing",
            Address = "Unity Empire, Shivneri, Sector 21",
            City = "Kharghar",
            TotalFloors = 6,
            TotalFlats = 30,
            BaseAreaSqFt = 4960,            // ~24m × 32m footprint
            BuildingType = "Residential",
            YearBuilt = 2024,
            Description = "6-floor residential building with 5 flats per floor (2BHK units). " +
                          "Features 2 lifts, lobby, 2 staircases, central passage, and open-air void shaft."
        };

        db.Buildings.Add(building);
        await db.SaveChangesAsync(); // Save to get the BuildingId

        // ───── Flat data matching buildings.json ─────
        // Format: FlatNo, Floor, CarpetArea (sqft), BUArea (sqft), Status
        var flatSeedData = new (string FlatNo, int Floor, decimal Carpet, decimal BuArea, string Status)[]
        {
            // Floor 1
            ("101", 1, 687m, 824m, "OWNER"),
            ("102", 1, 690m, 828m, "OWNER"),
            ("103", 1, 660m, 792m, "BUILDER"),
            ("104", 1, 710m, 852m, "BUILDER"),
            ("105", 1, 681m, 817m, "BUILDER"),

            // Floor 2
            ("201", 2, 687m, 824m, "OWNER"),
            ("202", 2, 690m, 828m, "BUILDER"),
            ("203", 2, 660m, 792m, "BUILDER"),
            ("204", 2, 710m, 852m, "OWNER"),
            ("205", 2, 681m, 817m, "BUILDER"),

            // Floor 3
            ("301", 3, 687m, 824m, "BUILDER"),
            ("302", 3, 690m, 828m, "OWNER"),
            ("303", 3, 660m, 792m, "OWNER"),
            ("304", 3, 710m, 852m, "BUILDER"),
            ("305", 3, 681m, 817m, "BUILDER"),

            // Floor 4
            ("401", 4, 687m, 824m, "OWNER"),
            ("402", 4, 690m, 828m, "OWNER"),
            ("403", 4, 660m, 792m, "BUILDER"),
            ("404", 4, 710m, 852m, "OWNER"),
            ("405", 4, 681m, 817m, "BUILDER"),

            // Floor 5
            ("501", 5, 687m, 824m, "BUILDER"),
            ("502", 5, 690m, 828m, "BUILDER"),
            ("503", 5, 660m, 792m, "OWNER"),
            ("504", 5, 710m, 852m, "BUILDER"),
            ("505", 5, 681m, 817m, "OWNER"),

            // Floor 6
            ("601", 6, 687m, 824m, "OWNER"),
            ("602", 6, 690m, 828m, "OWNER"),
            ("603", 6, 660m, 792m, "BUILDER"),
            ("604", 6, 710m, 852m, "BUILDER"),
            ("605", 6, 681m, 817m, "BUILDER"),
        };

        var flats = flatSeedData.Select(f => new Flat
        {
            FlatNumber = f.FlatNo,
            FloorNumber = f.Floor,
            AreaInSqFt = f.Carpet,
            Price = CalculatePrice(f.BuArea, f.Status),
            IsAvailable = f.Status == "BUILDER", // BUILDER flats are available for sale
            BuildingId = building.Id,
        }).ToList();

        db.Flats.AddRange(flats);
        await db.SaveChangesAsync();

        logger.LogInformation(
            "Seeded {BuildingName} with {FlatCount} flats across {FloorCount} floors.",
            building.Name, flats.Count, building.TotalFloors);
    }

    /// <summary>
    /// Calculates an indicative price based on built-up area.
    /// BUILDER flats get a slightly lower "launch" price.
    /// </summary>
    private static decimal CalculatePrice(decimal buAreaSqFt, string status)
    {
        const decimal ratePerSqFt = 8500m; // ₹8,500 per sq ft
        var basePrice = buAreaSqFt * ratePerSqFt;
        return status == "BUILDER"
            ? Math.Round(basePrice * 0.95m, 0) // 5% launch discount
            : Math.Round(basePrice, 0);
    }
}
