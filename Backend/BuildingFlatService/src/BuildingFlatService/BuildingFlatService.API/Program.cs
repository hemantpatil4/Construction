using System.Text;
using BuildingFlatService.API.Middleware;
using BuildingFlatService.Application;
using BuildingFlatService.Infrastructure;
using BuildingFlatService.Infrastructure.Persistence;
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
// IMPORTANT: This service does NOT issue tokens.
// It only VALIDATES tokens issued by the Auth Service.
// Both services share the same JWT Secret, Issuer, and Audience.
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
        ClockSkew = TimeSpan.Zero
    };

    // Custom response for 401/403
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogWarning("Authentication failed: {Error}", context.Exception.Message);
            return Task.CompletedTask;
        },
        OnForbidden = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogWarning("Forbidden access attempt to {Path}", context.HttpContext.Request.Path);
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ───── Swagger ─────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BuildingFlat Service API",
        Version = "v1",
        Description = "Manages Buildings and Flats. Requires JWT token from Auth Service."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter the JWT token obtained from Auth Service"
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

// ───── CORS ─────
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
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "BuildingFlat Service v1"));
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
    var db = scope.ServiceProvider.GetRequiredService<BuildingFlatDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        logger.LogInformation("Applying BuildingFlatDb migrations...");
        db.Database.Migrate();
        logger.LogInformation("BuildingFlatDb migrations applied successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to apply BuildingFlatDb migrations. Retrying in 10 seconds...");
        await Task.Delay(10000);
        db.Database.Migrate();
        logger.LogInformation("BuildingFlatDb migrations applied on retry.");
    }

    // ───── Seed initial building & flat data (only if DB is empty) ─────
    try
    {
        await DatabaseSeeder.SeedAsync(db, logger);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database seeding failed. The app will continue without seed data.");
    }
}

app.Run();
