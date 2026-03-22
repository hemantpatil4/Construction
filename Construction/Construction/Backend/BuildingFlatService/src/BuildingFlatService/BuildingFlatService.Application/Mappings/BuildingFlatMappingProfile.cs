using AutoMapper;
using BuildingFlatService.Application.DTOs.Building;
using BuildingFlatService.Application.DTOs.Flat;
using BuildingFlatService.Domain.Entities;

namespace BuildingFlatService.Application.Mappings;

public class BuildingFlatMappingProfile : Profile
{
    public BuildingFlatMappingProfile()
    {
        // ───── Building Mappings ─────
        CreateMap<Building, BuildingReadDto>()
            .ForMember(dest => dest.FlatCount, opt => opt.MapFrom(src => src.Flats.Count));

        CreateMap<Building, BuildingDetailDto>();

        CreateMap<CreateBuildingDto, Building>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Flats, opt => opt.Ignore());

        CreateMap<UpdateBuildingDto, Building>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Flats, opt => opt.Ignore());

        // ───── Flat Mappings ─────
        CreateMap<Flat, FlatReadDto>()
            .ForMember(dest => dest.BuildingName, opt => opt.MapFrom(src => src.Building != null ? src.Building.Name : string.Empty));

        CreateMap<CreateFlatDto, Flat>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Building, opt => opt.Ignore());

        CreateMap<UpdateFlatDto, Flat>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Building, opt => opt.Ignore());
    }
}
