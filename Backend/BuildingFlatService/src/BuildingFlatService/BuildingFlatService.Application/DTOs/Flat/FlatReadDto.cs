namespace BuildingFlatService.Application.DTOs.Flat;

public class FlatReadDto
{
    public int Id { get; set; }
    public string FlatNumber { get; set; } = string.Empty;
    public int FloorNumber { get; set; }
    public decimal AreaInSqFt { get; set; }
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; }
    public int BuildingId { get; set; }
    public string BuildingName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
