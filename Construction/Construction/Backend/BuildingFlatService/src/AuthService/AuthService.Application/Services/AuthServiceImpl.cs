using AutoMapper;
using FluentValidation;
using Microsoft.Extensions.Logging;
using AuthService.Application.DTOs;
using AuthService.Application.Exceptions;
using AuthService.Application.Interfaces;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using ValidationException = AuthService.Application.Exceptions.ValidationException;

namespace AuthService.Application.Services;

public class AuthServiceImpl : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IMapper _mapper;
    private readonly ILogger<AuthServiceImpl> _logger;
    private readonly IValidator<RegisterRequestDto> _registerValidator;
    private readonly IValidator<LoginRequestDto> _loginValidator;

    public AuthServiceImpl(
        IUserRepository userRepository,
        IJwtTokenGenerator jwtTokenGenerator,
        IPasswordHasher passwordHasher,
        IMapper mapper,
        ILogger<AuthServiceImpl> logger,
        IValidator<RegisterRequestDto> registerValidator,
        IValidator<LoginRequestDto> loginValidator)
    {
        _userRepository = userRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
        _passwordHasher = passwordHasher;
        _mapper = mapper;
        _logger = logger;
        _registerValidator = registerValidator;
        _loginValidator = loginValidator;
    }

    public async Task<UserReadDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Registration attempt for username: {Username}", request.Username);

        // Validate
        var validationResult = await _registerValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            throw new ValidationException(errors);
        }

        // Check for duplicates
        if (await _userRepository.ExistsByUsernameAsync(request.Username, cancellationToken))
            throw new ConflictException($"Username '{request.Username}' is already taken.");

        if (await _userRepository.ExistsByEmailAsync(request.Email, cancellationToken))
            throw new ConflictException($"Email '{request.Email}' is already registered.");

        // Map & hash password
        var user = _mapper.Map<AppUser>(request);
        user.PasswordHash = _passwordHasher.Hash(request.Password);
        user.Role = "User"; // SECURITY: Always register as User. Only admins can promote via Admin Panel.
        user.CreatedAt = DateTime.UtcNow;

        var created = await _userRepository.AddAsync(user, cancellationToken);

        _logger.LogInformation("User registered successfully: {Username} (Id: {UserId})", created.Username, created.Id);

        return _mapper.Map<UserReadDto>(created);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Login attempt for username: {Username}", request.Username);

        // Validate
        var validationResult = await _loginValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            throw new ValidationException(errors);
        }

        var user = await _userRepository.GetByUsernameAsync(request.Username, cancellationToken);
        if (user is null)
            throw new UnauthorizedException("Invalid username or password.");

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid username or password.");

        var token = _jwtTokenGenerator.GenerateToken(user);

        _logger.LogInformation("User logged in successfully: {Username}", user.Username);

        return new AuthResponseDto
        {
            Token = token,
            Username = user.Username,
            Role = user.Role,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };
    }
}
