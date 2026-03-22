using BuildingFlatService.Application.DTOs.Flat;
using FluentValidation;

namespace BuildingFlatService.Application.Validators;

public class CreateFlatValidator : AbstractValidator<CreateFlatDto>
{
    public CreateFlatValidator()
    {
        RuleFor(x => x.FlatNumber)
            .NotEmpty().WithMessage("Flat number is required.")
            .MaximumLength(20).WithMessage("Flat number must not exceed 20 characters.");

        RuleFor(x => x.FloorNumber)
            .GreaterThanOrEqualTo(0).WithMessage("Floor number must be 0 or greater.");

        RuleFor(x => x.AreaInSqFt)
            .GreaterThan(0).WithMessage("Area must be greater than 0.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than 0.");

        RuleFor(x => x.BuildingId)
            .GreaterThan(0).WithMessage("BuildingId is required.");
    }
}
