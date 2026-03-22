using System.Text;
using AuthService.API.Middleware;
using AuthService.Application;
using AuthService.Infrastructure;
using AuthService.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ───── Layer Registration (Clean Architecture DI) ─────
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// ───── Controllers ─────
builder.Services.AddControllers();

// ───── JWT Authentication ─────
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"]
    ?? throw new InvalidOperationException("JWT Secret is not configured.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero // Strict expiry
    };
});

builder.Services.AddAuthorization();

// ───── Swagger ─────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Auth Service API",
        Version = "v1",
        Description = "Handles user registration, login, and JWT token generation."
    });

    // Add JWT auth to Swagger UI
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ───── CORS (for cross-service calls in development) ─────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// ───── Middleware Pipeline ─────

// CORS must be the very first middleware so preflight OPTIONS requests
// get proper headers before any other middleware can interfere
app.UseCors("AllowAll");

app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Auth Service v1"));
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ───── Auto-apply EF Core migrations (creates DB + tables if missing) ─────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        logger.LogInformation("Applying AuthDb migrations...");
        db.Database.Migrate();
        logger.LogInformation("AuthDb migrations applied successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to apply AuthDb migrations. Retrying in 10 seconds...");
        await Task.Delay(10000);
        db.Database.Migrate();
        logger.LogInformation("AuthDb migrations applied on retry.");
    }

    // ───── Seed default Admin user (only if no Admin exists) ─────
    try
    {
        var hasAdmin = db.Users.Any(u => u.Role == "Admin");
        if (!hasAdmin)
        {
            var passwordHasher = scope.ServiceProvider
                .GetRequiredService<AuthService.Application.Interfaces.IPasswordHasher>();

            var adminUser = new AuthService.Domain.Entities.AppUser
            {
                Username = "Hemant",
                Email = "hemanttusharpatil@gmail.com",
                PasswordHash = passwordHasher.Hash("sonurutu"),
                Role = "Admin",
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(adminUser);
            db.SaveChanges();
            logger.LogInformation("Default Admin user seeded (username: Admin, password: Admin@123). CHANGE THIS PASSWORD IMMEDIATELY!");
        }
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Could not seed default Admin user. You may need to create one manually.");
    }

    // ───── Seed default settings (only if missing) ─────
    try
    {
        if (!db.Settings.Any(s => s.Key == "AppName"))
        {
            db.Settings.Add(new AuthService.Domain.Entities.AppSetting
            {
                Key = "AppName",
                Value = "ConstructPro",
                UpdatedAt = DateTime.UtcNow
            });
            db.SaveChanges();
            logger.LogInformation("Default AppName setting seeded.");
        }
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Could not seed default settings.");
    }
}

app.Run();
