using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Infrastructure.Identity; 
using Application.Common.Interfaces;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ITokenService _tokenService;

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

            var roles = await _userManager.GetRolesAsync(user);
            
            // Generate Token (Ensure user.Id and TenantId are valid)
            var token = _tokenService.GenerateToken(user.Id, user.UserName ?? "User", roles, user.TenantId ?? "");

            return Ok(new { token, role = roles.FirstOrDefault() });
        }

        // POST: api/Auth/register-owner (SECRET BACKDOOR)
        // This allows creating the FIRST Admin for a new shop manually via Swagger.
        [HttpPost("register-owner")]
        [AllowAnonymous] 
        public async Task<IActionResult> RegisterOwner([FromBody] RegisterOwnerRequest request)
        {
            // 1. SECURITY CHECK: Only YOU know this key
            if (request.MasterKey != "MySecretKey123!") 
            {
                return Unauthorized("Invalid Master Key. You are not authorized to create shops.");
            }

            // 2. Check if user exists
            if (await _userManager.FindByNameAsync(request.Username) != null)
                return BadRequest("Username already taken.");

            // 3. Create the Shop Owner User
            var user = new ApplicationUser
            {
                UserName = request.Username,
                Email = request.Username + "@store.local",
                TenantId = Guid.NewGuid().ToString(), // Generate a NEW Shop ID
                EmailConfirmed = true
            };

            // 4. Save to Database using UserManager (NOT _identityService)
            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded) 
            {
                return BadRequest(result.Errors);
            }

            // 5. Assign Admin Role
            await _userManager.AddToRoleAsync(user, "Admin");

            return Ok(new { message = $"Shop Owner '{request.Username}' created successfully! Shop ID: {user.TenantId}" });
        }

        // POST: api/Auth/create-staff (For Creating Cashiers)
        [Authorize(Roles = "Admin")]
        [HttpPost("create-staff")]
        public async Task<IActionResult> CreateStaff([FromBody] CreateStaffRequest request)
        {
            var adminId = _userManager.GetUserId(User);
            // Safety Check: Ensure adminId is not null
            if (string.IsNullOrEmpty(adminId)) return Unauthorized();

            var adminUser = await _userManager.FindByIdAsync(adminId);

            if (adminUser == null || string.IsNullOrEmpty(adminUser.TenantId))
            {
                return BadRequest("Current Admin does not belong to a valid Shop (Tenant).");
            }

            // Create Staff User (Inherit TenantId)
            var newUser = new ApplicationUser
            {
                UserName = request.Username,
                Email = request.Username + "@store.local", 
                TenantId = adminUser.TenantId, 
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(newUser, request.Password);

            if (!result.Succeeded)
            {
                return BadRequest(new { message = result.Errors.First().Description });
            }

            await _userManager.AddToRoleAsync(newUser, request.Role);

            return Ok(new { message = "Staff account created successfully." });
        }

        // --- DTO Classes ---
        public class LoginRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class RegisterOwnerRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string MasterKey { get; set; } = string.Empty; // Added MasterKey
        }

        public class CreateStaffRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string Role { get; set; } = "Cashier";
        }
    }
}