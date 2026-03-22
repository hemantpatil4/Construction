# Construction Management — Microservices Architecture

A production-ready microservices system built with **ASP.NET Core 8**, **Entity Framework Core**, **Clean Architecture**, and **JWT Authentication**.

---

## 📁 Full Folder Structure

```
BuildingFlatService/
├── Construction.sln
├── README.md
│
├── src/
│   ├── AuthService/                          # ── MICROSERVICE 1: Authentication ──
│   │   ├── AuthService.Domain/              # Entities, Enums, Repository Interfaces
│   │   │   ├── Entities/
│   │   │   │   └── AppUser.cs
│   │   │   ├── Enums/
│   │   │   │   └── AppRoles.cs
│   │   │   └── Interfaces/
│   │   │       └── IUserRepository.cs
│   │   │
│   │   ├── AuthService.Application/         # DTOs, Services, Validators, Mappings, Exceptions
│   │   │   ├── DTOs/
│   │   │   │   ├── RegisterRequestDto.cs
│   │   │   │   ├── LoginRequestDto.cs
│   │   │   │   ├── AuthResponseDto.cs
│   │   │   │   └── UserReadDto.cs
│   │   │   ├── Exceptions/
│   │   │   │   ├── NotFoundException.cs
│   │   │   │   ├── ValidationException.cs
│   │   │   │   ├── UnauthorizedException.cs
│   │   │   │   └── ConflictException.cs
│   │   │   ├── Interfaces/
│   │   │   │   ├── IAuthService.cs
│   │   │   │   ├── IJwtTokenGenerator.cs
│   │   │   │   └── IPasswordHasher.cs
│   │   │   ├── Mappings/
│   │   │   │   └── AuthMappingProfile.cs
│   │   │   ├── Services/
│   │   │   │   └── AuthServiceImpl.cs
│   │   │   ├── Validators/
│   │   │   │   ├── RegisterRequestValidator.cs
│   │   │   │   └── LoginRequestValidator.cs
│   │   │   └── DependencyInjection.cs
│   │   │
│   │   ├── AuthService.Infrastructure/      # EF Core DbContext, Repositories, JWT, Hashing
│   │   │   ├── Authentication/
│   │   │   │   ├── JwtTokenGenerator.cs
│   │   │   │   └── BcryptPasswordHasher.cs
│   │   │   ├── Persistence/
│   │   │   │   └── AuthDbContext.cs
│   │   │   ├── Repositories/
│   │   │   │   └── UserRepository.cs
│   │   │   └── DependencyInjection.cs
│   │   │
│   │   └── AuthService.API/                 # Controllers, Middleware, Program.cs
│   │       ├── Controllers/
│   │       │   └── AuthController.cs
│   │       ├── Middleware/
│   │       │   ├── ExceptionHandlingMiddleware.cs
│   │       │   └── RequestLoggingMiddleware.cs
│   │       ├── Models/
│   │       │   └── ApiErrorResponse.cs
│   │       ├── Properties/
│   │       │   └── launchSettings.json
│   │       ├── appsettings.json
│   │       ├── appsettings.Development.json
│   │       └── Program.cs
│   │
│   └── BuildingFlatService/                  # ── MICROSERVICE 2: Buildings & Flats ──
│       ├── BuildingFlatService.Domain/
│       │   ├── Entities/
│       │   │   ├── Building.cs
│       │   │   └── Flat.cs
│       │   └── Interfaces/
│       │       ├── IBuildingRepository.cs
│       │       └── IFlatRepository.cs
│       │
│       ├── BuildingFlatService.Application/
│       │   ├── DTOs/
│       │   │   ├── Building/
│       │   │   │   ├── BuildingReadDto.cs
│       │   │   │   ├── BuildingDetailDto.cs
│       │   │   │   ├── CreateBuildingDto.cs
│       │   │   │   └── UpdateBuildingDto.cs
│       │   │   └── Flat/
│       │   │       ├── FlatReadDto.cs
│       │   │       ├── CreateFlatDto.cs
│       │   │       └── UpdateFlatDto.cs
│       │   ├── Exceptions/
│       │   │   ├── NotFoundException.cs
│       │   │   ├── ValidationException.cs
│       │   │   └── UnauthorizedException.cs
│       │   ├── Interfaces/
│       │   │   ├── IBuildingService.cs
│       │   │   └── IFlatService.cs
│       │   ├── Mappings/
│       │   │   └── BuildingFlatMappingProfile.cs
│       │   ├── Services/
│       │   │   ├── BuildingServiceImpl.cs
│       │   │   └── FlatServiceImpl.cs
│       │   ├── Validators/
│       │   │   ├── CreateBuildingValidator.cs
│       │   │   ├── UpdateBuildingValidator.cs
│       │   │   ├── CreateFlatValidator.cs
│       │   │   └── UpdateFlatValidator.cs
│       │   └── DependencyInjection.cs
│       │
│       ├── BuildingFlatService.Infrastructure/
│       │   ├── Persistence/
│       │   │   └── BuildingFlatDbContext.cs
│       │   ├── Repositories/
│       │   │   ├── BuildingRepository.cs
│       │   │   └── FlatRepository.cs
│       │   └── DependencyInjection.cs
│       │
│       └── BuildingFlatService.API/
│           ├── Controllers/
│           │   ├── BuildingsController.cs
│           │   └── FlatsController.cs
│           ├── Middleware/
│           │   ├── ExceptionHandlingMiddleware.cs
│           │   └── RequestLoggingMiddleware.cs
│           ├── Models/
│           │   └── ApiErrorResponse.cs
│           ├── Properties/
│           │   └── launchSettings.json
│           ├── appsettings.json
│           ├── appsettings.Development.json
│           └── Program.cs
```

---

## 🔐 Authentication Flow Between Services (Step-by-Step)

This is the **most critical** architectural decision — how the two services securely communicate:

### The Flow

```
┌──────────┐     1. POST /api/auth/register    ┌──────────────┐
│          │ ──────────────────────────────────> │              │
│  Client  │     2. POST /api/auth/login        │ Auth Service │
│ (Postman │ ──────────────────────────────────> │  :5001/7001  │
│  / App)  │ <── 3. Returns JWT Token ───────── │              │
│          │                                     └──────────────┘
│          │
│          │     4. GET /api/buildings           ┌──────────────────┐
│          │     Authorization: Bearer <token>   │                  │
│          │ ──────────────────────────────────> │ BuildingFlat     │
│          │ <── 5. Returns data (if valid) ──── │ Service          │
│          │                                     │  :5002/7002      │
└──────────┘                                     └──────────────────┘
```

### Step-by-Step Explanation:

1. **Registration**: Client calls `POST /api/auth/register` on Auth Service with username, email, password, and role. Password is hashed using BCrypt and stored in `ConstructionAuthDb`.

2. **Login**: Client calls `POST /api/auth/login` with username and password. Auth Service validates credentials, then generates a **JWT token** containing:
   - `UserId` — User's database ID
   - `Username` — The user's login name
   - `Role` — "Admin" or "User"
   - `exp` — Expiry timestamp (1 hour by default)
   - Signed with **HMAC-SHA256** using the shared secret key

3. **Token Returned**: The JWT token is returned to the client in the response body.

4. **Authenticated Request**: Client sends any request to BuildingFlat Service with the header:

   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

5. **Token Validation (Stateless)**: BuildingFlat Service validates the token **locally** — no call to Auth Service needed. It checks:
   - ✅ Signature matches (same `Secret` key)
   - ✅ Issuer matches (`AuthService`)
   - ✅ Audience matches (`ConstructionServices`)
   - ✅ Token is not expired
   - ✅ Role claim matches the `[Authorize(Roles = "Admin")]` requirement

### Why This Works:

Both services share the **same** JWT configuration in `appsettings.json`:

```json
"JwtSettings": {
    "Secret": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!",
    "Issuer": "AuthService",
    "Audience": "ConstructionServices"
}
```

**This is symmetric JWT validation** — the simplest and most performant approach for microservices that share a trust boundary.

---

## 🚀 How to Run

### Prerequisites

- .NET 8 SDK
- SQL Server (local or Docker)

### Steps

```bash
# 1. Restore all packages
cd BuildingFlatService
dotnet restore Construction.sln

# 2. Apply EF Core migrations (from each API project)
# Auth Service
cd src/AuthService/AuthService.API
dotnet ef migrations add InitialCreate --project ../AuthService.Infrastructure
dotnet ef database update --project ../AuthService.Infrastructure

# BuildingFlat Service
cd ../../BuildingFlatService/BuildingFlatService.API
dotnet ef migrations add InitialCreate --project ../BuildingFlatService.Infrastructure
dotnet ef database update --project ../BuildingFlatService.Infrastructure

# 3. Run both services (in separate terminals)
# Terminal 1:
cd src/AuthService/AuthService.API
dotnet run

# Terminal 2:
cd src/BuildingFlatService/BuildingFlatService.API
dotnet run
```

### Service URLs:

| Service              | HTTP                  | HTTPS                  | Swagger  |
| -------------------- | --------------------- | ---------------------- | -------- |
| Auth Service         | http://localhost:5001 | https://localhost:7001 | /swagger |
| BuildingFlat Service | http://localhost:5002 | https://localhost:7002 | /swagger |

---

## 📋 Sample Request/Response Payloads

### 1. Register User

```http
POST https://localhost:7001/api/auth/register
Content-Type: application/json

{
    "username": "adminuser",
    "email": "admin@construction.com",
    "password": "Admin@123",
    "role": "Admin"
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "username": "adminuser",
  "email": "admin@construction.com",
  "role": "Admin",
  "createdAt": "2026-03-04T10:00:00Z"
}
```

### 2. Login

```http
POST https://localhost:7001/api/auth/login
Content-Type: application/json

{
    "username": "adminuser",
    "password": "Admin@123"
}
```

**Response (200 OK):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "adminuser",
  "role": "Admin",
  "expiresAt": "2026-03-04T11:00:00Z"
}
```

### 3. Create Building (Admin Only)

```http
POST https://localhost:7002/api/buildings
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
    "name": "Sunrise Towers",
    "address": "123 Main Street",
    "city": "Mumbai"
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "name": "Sunrise Towers",
  "address": "123 Main Street",
  "city": "Mumbai",
  "createdAt": "2026-03-04T10:05:00Z",
  "flatCount": 0
}
```

### 4. Create Flat (Admin Only)

```http
POST https://localhost:7002/api/flats
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
    "flatNumber": "A-101",
    "floorNumber": 1,
    "areaInSqFt": 1200.50,
    "price": 7500000.00,
    "isAvailable": true,
    "buildingId": 1
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "flatNumber": "A-101",
  "floorNumber": 1,
  "areaInSqFt": 1200.5,
  "price": 7500000.0,
  "isAvailable": true,
  "buildingId": 1,
  "buildingName": "Sunrise Towers",
  "createdAt": "2026-03-04T10:06:00Z"
}
```

### 5. Get Building with Flats

```http
GET https://localhost:7002/api/buildings/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200 OK):**

```json
{
  "id": 1,
  "name": "Sunrise Towers",
  "address": "123 Main Street",
  "city": "Mumbai",
  "createdAt": "2026-03-04T10:05:00Z",
  "flats": [
    {
      "id": 1,
      "flatNumber": "A-101",
      "floorNumber": 1,
      "areaInSqFt": 1200.5,
      "price": 7500000.0,
      "isAvailable": true,
      "buildingId": 1,
      "buildingName": "Sunrise Towers",
      "createdAt": "2026-03-04T10:06:00Z"
    }
  ]
}
```

### 6. Validation Error Response

```json
{
  "statusCode": 400,
  "message": "One or more validation errors occurred.",
  "errors": {
    "Name": ["Building name is required."],
    "City": ["City must not exceed 100 characters."]
  },
  "traceId": "00-abc123...",
  "timestamp": "2026-03-04T10:10:00Z"
}
```

### 7. Unauthorized Response (No/Invalid Token)

```json
{
  "statusCode": 401,
  "message": "Invalid username or password.",
  "errors": null,
  "traceId": "00-def456...",
  "timestamp": "2026-03-04T10:12:00Z"
}
```

---

## 🏗️ Future Extension: Quotation Service

The architecture is designed for easy extension. To add a Quotation Service:

```
src/
└── QuotationService/
    ├── QuotationService.Domain/
    │   └── Entities/
    │       └── Quotation.cs    (FlatId, Discount, FinalPrice, GeneratedBy, GeneratedAt)
    ├── QuotationService.Application/
    ├── QuotationService.Infrastructure/
    └── QuotationService.API/
        └── appsettings.json    (same JwtSettings — instant auth!)
```

The Quotation entity would reference `FlatId` (cross-service reference by ID, not a direct FK) and validate JWT tokens using the same shared configuration.

---

## 🧠 Key Architecture Decisions

| Decision                                             | Rationale                                                                               |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Clean Architecture (4 layers)**                    | Separation of concerns; domain never depends on infrastructure                          |
| **Symmetric JWT (shared secret)**                    | Simplest & fastest for same-trust-boundary services; no service-to-service calls needed |
| **BCrypt for password hashing**                      | Industry standard; work factor 12 is secure against brute force                         |
| **FluentValidation**                                 | Declarative validation rules, cleaner than DataAnnotations for complex rules            |
| **AutoMapper**                                       | Eliminates repetitive entity↔DTO mapping code                                           |
| **Repository pattern**                               | Abstracts EF Core; easy to mock for unit tests                                          |
| **Centralized exception middleware**                 | Single place for error handling; consistent error responses                             |
| **Separate Create/Update/Read DTOs**                 | Prevents over-posting attacks; each DTO has only the fields needed                      |
| **CancellationToken everywhere**                     | Proper async cancellation support for production workloads                              |
| **Cascade delete on Building→Flats**                 | When a building is deleted, all its flats are automatically removed                     |
| **Composite unique index (BuildingId + FlatNumber)** | Prevents duplicate flat numbers within the same building                                |

---

## 📦 NuGet Packages Used

| Package                                         | Purpose                         |
| ----------------------------------------------- | ------------------------------- |
| `Microsoft.EntityFrameworkCore.SqlServer`       | SQL Server database provider    |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | JWT token validation middleware |
| `System.IdentityModel.Tokens.Jwt`               | JWT token creation              |
| `AutoMapper`                                    | Object-to-object mapping        |
| `FluentValidation`                              | Input validation                |
| `BCrypt.Net-Next`                               | Password hashing                |
| `Swashbuckle.AspNetCore`                        | Swagger/OpenAPI documentation   |
