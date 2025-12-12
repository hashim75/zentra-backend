using Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // <--- THIS WAS MISSING!

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DebugController : ControllerBase
    {
        private readonly ICurrentUserService _currentUserService;
        private readonly IApplicationDbContext _context;

        public DebugController(ICurrentUserService currentUserService, IApplicationDbContext context)
        {
            _currentUserService = currentUserService;
            _context = context;
        }

        [HttpGet("who-am-i")]
        public IActionResult WhoAmI()
        {
            return Ok(new 
            {
                UserId = _currentUserService.UserId,
                TenantId = _currentUserService.TenantId,
                IsAuthenticated = User.Identity?.IsAuthenticated,
                Claims = User.Claims.Select(c => new { c.Type, c.Value })
            });
        }

        [HttpGet("raw-categories")]
        public IActionResult GetRawCategories()
        {
            // We cast to IQueryable to ensure the extension method works
            var allData = _context.Categories
                .IgnoreQueryFilters()
                .Select(c => new { c.Id, c.Name, c.TenantId }) 
                .ToList();

            return Ok(allData);
        }
    }
}