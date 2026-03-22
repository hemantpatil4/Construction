namespace BuildingFlatService.Application.DTOs.Building;

public class BuildingDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public int TotalFloors { get; set; }
    public int TotalFlats { get; set; }
    public double BaseAreaSqFt { get; set; }
    public string BuildingType { get; set; } = string.Empty;
    public int? YearBuilt { get; set; }
    public string? Description { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool ShowOnMap { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<BuildingFlatService.Application.DTOs.Flat.FlatReadDto> Flats { get; set; } = new();
}
