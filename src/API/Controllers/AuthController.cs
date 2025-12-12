using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Infrastructure.Identity; // Ensures connection to ApplicationUser
using Application.Common.Interfaces; // For ITokenService if you use it

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ITokenService _tokenService; // Assuming you have a Token Service

        public AuthController(
            UserManager<ApplicationUser> userManager, 
            SignInManager<ApplicationUser> signInManager,
            ITokenService tokenService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
        }

        // POST: api/Auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _userManager.FindByNameAsync(request.Username);
            if (user == null) return Unauthorized("Invalid username or password.");

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            
            if (!result.Succeeded) return Unauthorized("Invalid username or password.");

            // Generate Token
            var roles = await _userManager.GetRolesAsync(user);
            var token = _tokenService.GenerateToken(user.Id, user.UserName, roles, user.TenantId);

            return Ok(new { token, role = roles.FirstOrDefault() });
        }

        // POST: api/Auth/register (For the Initial Shop Owner)
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            // Check if user exists
            if (await _userManager.FindByNameAsync(request.Username) != null)
                return BadRequest("Username already taken.");

            var user = new ApplicationUser
            {
                UserName = request.Username,
                Email = request.Username + "@store.local",
                TenantId = Guid.NewGuid().ToString(), // Generate a NEW Shop ID for the Owner
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded) return BadRequest(result.Errors);

            // Assign Admin Role
            await _userManager.AddToRoleAsync(user, "Admin");

            return Ok(new { message = "Shop Owner registered successfully." });
        }

        // POST: api/Auth/create-staff (For Creating Cashiers)
        [Authorize(Roles = "Admin")]
        [HttpPost("create-staff")]
        public async Task<IActionResult> CreateStaff([FromBody] CreateStaffRequest request)
        {
            // 1. Get Current Admin details to find the Shop ID
            var adminId = _userManager.GetUserId(User);
            var adminUser = await _userManager.FindByIdAsync(adminId);

            if (adminUser == null || string.IsNullOrEmpty(adminUser.TenantId))
            {
                return BadRequest("Current Admin does not belong to a valid Shop (Tenant).");
            }

            // 2. Create the New User
            var newUser = new ApplicationUser
            {
                UserName = request.Username,
                Email = request.Username + "@store.local", 
                TenantId = adminUser.TenantId, // <--- CRITICAL: Inherit Admin's Shop ID
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(newUser, request.Password);

            if (!result.Succeeded)
            {
                return BadRequest(new { message = result.Errors.First().Description });
            }

            // 3. Assign Role (Cashier or Admin)
            await _userManager.AddToRoleAsync(newUser, request.Role);

            return Ok(new { message = "Staff account created successfully." });
        }

        // --- DTO Classes ---
        public class LoginRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class RegisterRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class CreateStaffRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string Role { get; set; } = "Cashier";
        }
    }
}