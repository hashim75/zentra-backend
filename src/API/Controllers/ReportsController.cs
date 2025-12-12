using Microsoft.AspNetCore.Mvc;
using Application.Reports.Queries; 
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers
{
    [Authorize]
    public class ReportsController : ApiControllerBase
    {
        [HttpPost("generate")]
        public async Task<ActionResult<ReportDto>> GenerateReport([FromBody] GetReportsQuery query)
        {
            return await Mediator.Send(query);
        }
    }
}