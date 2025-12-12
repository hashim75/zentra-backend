using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Application.Dashboard.Queries; // <--- ENSURE THIS IS HERE

namespace API.Controllers
{
    [Authorize]
    public class DashboardController : ApiControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<DashboardStatsDto>> GetStats()
        {
            // The controller sends the query to the Handler
            // and returns the DashboardStatsDto we just defined.
            return await Mediator.Send(new GetDashboardStatsQuery());
        }
    }
}