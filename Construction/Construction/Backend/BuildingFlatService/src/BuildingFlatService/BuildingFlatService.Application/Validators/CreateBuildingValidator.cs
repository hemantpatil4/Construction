using BuildingFlatService.Application.DTOs.Building;
using FluentValidation;

namespace BuildingFlatService.Application.Validators;

public class CreateBuildingValidator : AbstractValidator<CreateBuildingDto>
{
    private static readonly string[] AllowedTypes = { "Residential", "Commercial", "Mixed" };

    public CreateBuildingValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Building name is required.")
            .MaximumLength(150).WithMessage("Building name must not exceed 150 characters.");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Address is required.")
            .MaximumLength(300).WithMessage("Address must not exceed 300 characters.");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required.")
            .MaximumLength(100).WithMessage("City must not exceed 100 characters.");

        RuleFor(x => x.TotalFloors)
            .GreaterThan(0).WithMessage("Total floors must be at least 1.")
            .LessThanOrEqualTo(200).WithMessage("Total floors must not exceed 200.");

        RuleFor(x => x.TotalFlats)
            .GreaterThan(0).WithMessage("Total flats must be at least 1.")
            .LessThanOrEqualTo(5000).WithMessage("Total flats must not exceed 5000.");

        RuleFor(x => x.BaseAreaSqFt)
            .GreaterThan(0).WithMessage("Base area must be greater than 0.");

        RuleFor(x => x.BuildingType)
            .NotEmpty().WithMessage("Building type is required.")
            .Must(t => AllowedTypes.Contains(t))
            .WithMessage("Building type must be Residential, Commercial, or Mixed.");

        RuleFor(x => x.YearBuilt)
            .GreaterThan(1800).When(x => x.YearBuilt.HasValue)
            .WithMessage("Year built must be after 1800.")
            .LessThanOrEqualTo(DateTime.UtcNow.Year + 5).When(x => x.YearBuilt.HasValue)
            .WithMessage("Year built cannot be more than 5 years in the future.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).When(x => x.Description is not null)
            .WithMessage("Description must not exceed 1000 characters.");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90).When(x => x.Latitude.HasValue)
            .WithMessage("Latitude must be between -90 and 90.");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180).When(x => x.Longitude.HasValue)
            .WithMessage("Longitude must be between -180 and 180.");
    }
}
