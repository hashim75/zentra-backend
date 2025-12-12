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
using Npgsql; // Needed for connection string building

var builder = WebApplication.CreateBuilder(args);

// --- 1. ROBUST DATABASE CONNECTION LOGIC ---
// We start by checking for the Railway Environment Variable
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
string connectionString = "";

if (!string.IsNullOrEmpty(databaseUrl))
{
    // CASE 1: Found Railway Database
    Console.WriteLine("✅ FOUND RAILWAY DATABASE URL!");
    try 
    {
        connectionString = BuildConnectionString(databaseUrl);
        Console.WriteLine("✅ Successfully parsed Railway Connection String.");
    }
    catch(Exception ex)
    {
        Console.WriteLine($"❌ Error parsing Railway URL: {ex.Message}");
        // Fallback or crash intentionally so we know
        throw new Exception("Could not parse Railway Database URL");
    }
}
else
{
    // CASE 2: No Railway DB found - Using Localhost
    Console.WriteLine("⚠️ NO DATABASE_URL FOUND. FALLING BACK TO LOCALHOST/DEFAULT.");
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Host=localhost;Database=khanpurpos;Username=postgres;Password=password";
}

// 2. Add Database Context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString,
        b => b.MigrationsAssembly("Infrastructure")));

// 3. Add Layers & Services
builder.Services.AddApplicationServices();
builder.Services.AddScoped<IApplicationDbContext>(provider => 
    provider.GetRequiredService<ApplicationDbContext>());

builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddTransient<IIdentityService, IdentityService>();
builder.Services.AddScoped<ITokenService, TokenService>(); 

builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddHttpContextAccessor();

// 4. Authentication (JWT)
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
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "ZentraAPI",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "ZentraClient",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "super_secret_key_12345_make_sure_this_is_long"))
    };
});

// 5. Controllers & Swagger
builder.Services.AddControllers(options => 
    options.Filters.Add<ApiExceptionFilterAttribute>())
    .AddJsonOptions(options => 
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
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
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type=ReferenceType.SecurityScheme, Id="Bearer" } }, new string[]{} }
    });
});

// 6. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy => { policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader(); });
});

var app = builder.Build();

// --- PIPELINE ---

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// --- 7. AUTO-MIGRATE & SEED ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try 
    {
        Console.WriteLine("🔄 Starting Database Migration...");
        var context = services.GetRequiredService<ApplicationDbContext>();
        
        // This will verify connectivity
        await context.Database.MigrateAsync();
        Console.WriteLine("✅ Database Migration Successful!");

        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        string[] roleNames = { "Admin", "Cashier" };
        foreach (var roleName in roleNames)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
                Console.WriteLine($"✅ Created Role: {roleName}");
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ CRITICAL MIGRATION ERROR: {ex.Message}");
        if(ex.InnerException != null) Console.WriteLine($"   Inner Error: {ex.InnerException.Message}");
    }
}

app.Run();

// --- HELPER FUNCTION ---
static string BuildConnectionString(string databaseUrl)
{
    var databaseUri = new Uri(databaseUrl);
    var userInfo = databaseUri.UserInfo.Split(':');
    var builder = new NpgsqlConnectionStringBuilder
    {
        Host = databaseUri.Host,
        Port = databaseUri.Port,
        Username = userInfo[0],
        Password = userInfo[1],
        Database = databaseUri.LocalPath.TrimStart('/'),
        SslMode = SslMode.Disable // Try SslMode.Require if Disable fails on Railway
    };
    return builder.ToString();
}