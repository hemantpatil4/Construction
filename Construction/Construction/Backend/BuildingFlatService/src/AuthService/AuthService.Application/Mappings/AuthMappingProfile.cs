using AutoMapper;
using AuthService.Application.DTOs;
using AuthService.Domain.Entities;

namespace AuthService.Application.Mappings;

public class AuthMappingProfile : Profile
{
    public AuthMappingProfile()
    {
        CreateMap<AppUser, UserReadDto>();

        // RegisterRequestDto -> AppUser (password hash set separately in service)
        CreateMap<RegisterRequestDto, AppUser>()
            .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());
    }
}
