using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AspNetCoreRateLimit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Api.Configuration;
using Api.Data;
using Api.Middleware;
using Api.Services;
using Api.Swagger;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers(options =>
    {
        // Global filter to enforce password change when MustChangePassword flag is set
        options.Filters.Add<Api.Filters.EnforceMustChangePasswordAttribute>();
    })
    .AddJsonOptions(options =>
    {
        // Serialize enums as lowercase strings (admin, manager, user)
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// Register application services
builder.Services.AddSingleton<IPasswordService, PasswordService>();
builder.Services.AddSingleton<IAvatarUrlValidator, AvatarUrlValidator>();
builder.Services.AddSingleton(TimeProvider.System);

// Configure JWT settings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));
builder.Services.AddSingleton<IJwtService, JwtService>();

// Configure Security settings
builder.Services.Configure<SecuritySettings>(builder.Configuration.GetSection(SecuritySettings.SectionName));

// Register background services
builder.Services.AddHostedService<RefreshTokenCleanupService>();

// Configure Forwarded Headers for reverse proxy scenarios
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

    if (builder.Environment.IsDevelopment())
    {
        // Clear default network restrictions for development only
        // This allows any X-Forwarded-For header to be trusted
        options.KnownIPNetworks.Clear();
        options.KnownProxies.Clear();
    }
    // In production, KnownProxies/KnownNetworks should be configured via environment variables
    // or appsettings.Production.json to specify trusted proxy IP addresses
    // Example: options.KnownProxies.Add(IPAddress.Parse("10.0.0.100"));
});

// Configure IP Rate Limiting
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
builder.Services.AddSingleton<IRateLimitConfiguration, CustomRateLimitConfiguration>();
builder.Services.AddInMemoryRateLimiting();

// Configure JWT authentication with startup validation
var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()!;

// SECURITY: Validate JWT secret at startup
if (string.IsNullOrWhiteSpace(jwtSettings.Secret) || jwtSettings.Secret.Length < 32)
{
    throw new InvalidOperationException(
        "JWT Secret must be configured and at least 32 characters. " +
        "Set via environment variable Jwt__Secret or in appsettings.{Environment}.json");
}

// SECURITY: Reject known placeholder values in non-development environments
if (!builder.Environment.IsDevelopment())
{
    var insecureSecrets = new[]
    {
        "dev-only-secret-not-for-production-min-32-chars!",
        "CHANGE-THIS-SECRET-IN-PRODUCTION-MIN-32-CHARS"
    };

    if (insecureSecrets.Any(s => jwtSettings.Secret.Contains(s, StringComparison.OrdinalIgnoreCase)))
    {
        throw new InvalidOperationException(
            "SECURITY ERROR: JWT Secret contains development placeholder value. " +
            "Configure a secure secret via environment variable Jwt__Secret for production.");
    }
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Configure PostgreSQL with Entity Framework Core
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());

// Configure OpenAPI/Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Version = "v1",
        Title = "Nexum API",
        Description = "Backend API for Nexum - a modern note-taking application",
        Contact = new OpenApiContact
        {
            Name = "Development Team",
        }
    });

    // Include XML comments
    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));

    // Add error schemas and response examples
    options.DocumentFilter<ErrorSchemaDocumentFilter>();
    options.OperationFilter<ErrorResponsesOperationFilter>();
});

// Add CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Forwarded headers - must be first to correctly identify client IPs behind reverse proxy
app.UseForwardedHeaders();

// Global exception handling
app.UseApiExceptionHandling();

// Rate limiting - early in pipeline to protect against abuse
app.UseCustomIpRateLimiting();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // Enable Swagger UI
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Nexum API v1");
        options.RoutePrefix = string.Empty; // Swagger UI at root
    });
}

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Make the implicit Program class public for WebApplicationFactory
public partial class Program { }
