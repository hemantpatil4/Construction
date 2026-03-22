using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildingFlatService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBuildingVisualizationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "BaseAreaSqFt",
                table: "Buildings",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "BuildingType",
                table: "Buildings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Residential");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Buildings",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalFlats",
                table: "Buildings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalFloors",
                table: "Buildings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "YearBuilt",
                table: "Buildings",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BaseAreaSqFt",
                table: "Buildings");

            migrationBuilder.DropColumn(
                name: "BuildingType",
                table: "Buildings");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Buildings");

            migrationBuilder.DropColumn(
                name: "TotalFlats",
                table: "Buildings");

            migrationBuilder.DropColumn(
                name: "TotalFloors",
                table: "Buildings");

            migrationBuilder.DropColumn(
                name: "YearBuilt",
                table: "Buildings");
        }
    }
}
