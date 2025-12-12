using API.Filters;
using API.Services;
using Application;
using Application.Common.Interfaces;
using Infrastructure.Identity;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Layers
builder.Services.AddApplicationServices();

// --- 2. DATABASE CONNECTION (UPDATED FOR RAILWAY) ---
// Railway injects the connection string as an Environment Variable.
// We check that first. If missing, we fallback to appsettings.json.
var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection") 
                       ?? builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString,
        b => b.MigrationsAssembly("Infrastructure")));

builder.Services.AddScoped<IApplicationDbContext>(provider => 
    provider.GetRequiredService<ApplicationDbContext>());

// 3. Add Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddTransient<IIdentityService, IdentityService>();

// --- REGISTER TOKEN SERVICE (Crucial for AuthController) ---
builder.Services.AddScoped<ITokenService, TokenService>(); 

// 4. Add Multi-Tenancy & Security
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddHttpContextAccessor();

// 5. Add Authentication (JWT)
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
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
});

// 6. Add Controllers
builder.Services.AddControllers(options => 
    options.Filters.Add<ApiExceptionFilterAttribute>())
    .AddJsonOptions(options => 
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();

// 7. Add Swagger
builder.Services.AddSwaggerGen(option =>
{
    option.SwaggerDoc("v1", new OpenApiInfo { Title = "KhanpurPOS API", Version = "v1" });
    option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter a valid token",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });
    option.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type=ReferenceType.SecurityScheme,
                    Id="Bearer"
                }
            },
            new string[]{}
        }
    });
});

// --- 8. CORS (UPDATED TO ALLOW ALL) ---
// Essential for the Desktop App to connect from anywhere
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// --- 9. PIPELINE CONFIGURATION ---

// ENABLE SWAGGER IN PRODUCTION (For your Manual Registration)
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

// USE THE NEW CORS POLICY
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// --- 10. AUTO-MIGRATE DATABASE (For Railway) ---
// This ensures tables are created automatically when deployed
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try 
    {
        db.Database.Migrate();
    }
    catch (Exception ex)
    {
        // Log error or ignore if DB already exists
        Console.WriteLine($"Migration Error: {ex.Message}");
    }
}

app.Run();