using Microsoft.AspNetCore.Mvc;
using MediatR;
using Application.AuditLogs.Queries;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditLogsController : ControllerBase
    {
        private readonly IMediator _mediator;
        public AuditLogsController(IMediator mediator) => _mediator = mediator;

        [HttpGet]
        public async Task<List<AuditLogDto>> GetAll()
        {
            return await _mediator.Send(new GetAuditLogsQuery());
        }
    }
}