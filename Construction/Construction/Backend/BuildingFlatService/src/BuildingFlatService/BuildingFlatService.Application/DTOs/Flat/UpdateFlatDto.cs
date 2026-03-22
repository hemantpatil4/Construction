namespace BuildingFlatService.Application.DTOs.Flat;

public class UpdateFlatDto
{
    public string FlatNumber { get; set; } = string.Empty;
    public int FloorNumber { get; set; }
    public decimal AreaInSqFt { get; set; }
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; }
    public int BuildingId { get; set; }
}
