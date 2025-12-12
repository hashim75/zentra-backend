using Microsoft.AspNetCore.Mvc;
using MediatR;
using Application.SalesReturns.Commands;
using Application.SalesReturns.Queries;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SalesReturnsController : ControllerBase
    {
        private readonly IMediator _mediator;
        public SalesReturnsController(IMediator mediator) => _mediator = mediator;

        [HttpGet]
        public async Task<List<SalesReturnDto>> GetAll()
        {
            return await _mediator.Send(new GetSalesReturnsQuery());
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateSalesReturnCommand command)
        {
            return await _mediator.Send(command);
        }
    }
}