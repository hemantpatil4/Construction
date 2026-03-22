namespace BuildingFlatService.Domain.Entities;

public class Flat
{
    public int Id { get; set; }
    public string FlatNumber { get; set; } = string.Empty;
    public int FloorNumber { get; set; }
    public decimal AreaInSqFt { get; set; }
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Foreign key
    public int BuildingId { get; set; }

    // Navigation property
    public Building Building { get; set; } = null!;
}
