using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Identity
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;

        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(string userId, string username, IList<string> roles, string? tenantId)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(JwtRegisteredClaimNames.UniqueName, username),
                new Claim(ClaimTypes.NameIdentifier, userId),
                // IMPORTANT: Add the Shop ID (Tenant) to the token so we know who they are later
                new Claim("tenant", tenantId ?? "") 
            };

            // Add Roles (Admin/Cashier)
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            // Security Key (In real app, put this in appsettings.json)
            var keyString = _configuration["Jwt:Key"] ?? "ThisIsASecretKey1234567890ThisIsASecretKey1234567890"; 
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "ZentraRetail",
                audience: _configuration["Jwt:Audience"] ?? "ZentraRetailUsers",
                claims: claims,
                expires: DateTime.Now.AddDays(7), // Token lasts 7 days
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}