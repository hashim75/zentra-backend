using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Common.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Identity
{
    public class IdentityService : IIdentityService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager; // <--- To manage Roles
        private readonly IConfiguration _configuration;

        public IdentityService(
            UserManager<ApplicationUser> userManager, 
            RoleManager<IdentityRole> roleManager,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
        }

        public async Task<string> GetUserNameAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            return user?.UserName ?? string.Empty;
        }

        public async Task<(bool IsSuccess, string UserId)> CreateUserAsync(string userName, string password, string tenantId, string role = "Admin")
        {
            var user = new ApplicationUser
            {
                UserName = userName,
                Email = userName,
                TenantId = tenantId
            };

            // 1. Create the User
            var result = await _userManager.CreateAsync(user, password);

            if (!result.Succeeded)
            {
                return (false, string.Empty);
            }

            // 2. Ensure the Role exists in the database
            if (!await _roleManager.RoleExistsAsync(role))
            {
                await _roleManager.CreateAsync(new IdentityRole(role));
            }

            // 3. Assign Role to User (CRITICAL STEP)
            var roleResult = await _userManager.AddToRoleAsync(user, role);

            if (!roleResult.Succeeded)
            {
                // If role assignment failed, DELETE the user to prevent "broken" accounts
                await _userManager.DeleteAsync(user);
                return (false, string.Empty);
            }

            return (true, user.Id);
        }

        public async Task<string?> AuthenticateAsync(string username, string password)
        {
            // 1. Find User
            var user = await _userManager.FindByNameAsync(username);
            
            if (user == null || !await _userManager.CheckPasswordAsync(user, password))
            {
                return null; // Login failed
            }

            // 2. Get User Roles (Admin, Cashier, etc.)
            var userRoles = await _userManager.GetRolesAsync(user);

            // 3. Build Token Claims (The Data inside the Key Card)
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName!),
                new Claim("tenant", user.TenantId) // Custom Claim for Shop ID
            };

            // Add every role as a Claim so [Authorize(Roles="Admin")] works
            foreach (var role in userRoles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            // 4. Generate the JWT String
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]!);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(30), // Token valid for 30 days
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}