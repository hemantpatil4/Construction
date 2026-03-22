using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildingFlatService.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBuildingMapFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "Buildings",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "Buildings",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShowOnMap",
                table: "Buildings",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Buildings");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Buildings");

            migrationBuilder.DropColumn(
                name: "ShowOnMap",
                table: "Buildings");
        }
    }
}
