using System.Security.Claims;
using Application.Common.Interfaces;

namespace API.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        // 1. Read User ID from the Token
        public string? UserId => _httpContextAccessor.HttpContext?.User?
            .FindFirstValue(ClaimTypes.NameIdentifier);

        // 2. Read Tenant ID (Shop Name) from the Token
        // We added this claim in IdentityService.cs earlier
        public string? TenantId => _httpContextAccessor.HttpContext?.User?
            .FindFirstValue("tenant");
    }
}