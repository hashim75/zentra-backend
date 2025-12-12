using Microsoft.AspNetCore.Identity;

namespace Infrastructure.Identity
{
    public class ApplicationUser : IdentityUser
    {
        // We add this field to group users by Shop
        public string? TenantId { get; set; } 
    }
}