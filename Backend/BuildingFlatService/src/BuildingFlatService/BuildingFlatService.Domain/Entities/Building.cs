namespace BuildingFlatService.Domain.Entities;

public class Building
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;

    // ─── Visualization / Structural Fields ───
    public int TotalFloors { get; set; }
    public int TotalFlats { get; set; }
    public double BaseAreaSqFt { get; set; }
    public string BuildingType { get; set; } = "Residential"; // Residential, Commercial, Mixed
    public int? YearBuilt { get; set; }
    public string? Description { get; set; }

    // ─── Map / Location Fields ───
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool ShowOnMap { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public ICollection<Flat> Flats { get; set; } = new List<Flat>();
}
