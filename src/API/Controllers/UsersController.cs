using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Application.Users.Queries;
using Infrastructure.Identity; // Ensure this connects to your ApplicationUser

namespace API.Controllers
{
    [Authorize(Roles = "Admin")] // Only Admins can see this
    public class UsersController : ApiControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public UsersController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<List<UserDto>>> GetUsers()
        {
            // 1. Identify the Current Admin
            var currentUserId = _userManager.GetUserId(User);
            var currentUser = await _userManager.FindByIdAsync(currentUserId);

            if (currentUser == null) return Unauthorized();

            // 2. Filter: Fetch users ONLY from the same Tenant (Shop)
            // If the admin has no TenantId (e.g. Super Admin), we might return all or none. 
            // Here we assume strict filtering.
            var users = await _userManager.Users
                .Where(u => u.TenantId == currentUser.TenantId) 
                .ToListAsync();

            var userDtos = new List<UserDto>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                
                // Optional: Don't show the Admin himself in the list if you prefer
                // if (user.Id == currentUserId) continue; 

                userDtos.Add(new UserDto
                {
                    Id = user.Id,
                    Username = user.UserName ?? "Unknown",
                    Role = roles.FirstOrDefault() ?? "Cashier"
                });
            }

            return userDtos;
        }

        // DELETE: api/Users/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteUser(string id)
        {
            // 1. Identify the Current Admin
            var currentUserId = _userManager.GetUserId(User);
            var currentUser = await _userManager.FindByIdAsync(currentUserId);

            var userToDelete = await _userManager.FindByIdAsync(id);
            if (userToDelete == null) return NotFound();

            // 2. Security Check: Prevent deleting users from OTHER shops
            if (userToDelete.TenantId != currentUser.TenantId)
            {
                return Forbid(); // 403 Forbidden
            }

            // 3. Prevent deleting yourself
            if (userToDelete.Id == currentUserId)
            {
                return BadRequest("You cannot delete your own account.");
            }

            var result = await _userManager.DeleteAsync(userToDelete);
            if (!result.Succeeded) return BadRequest(result.Errors);

            return NoContent();
        }
    }
}