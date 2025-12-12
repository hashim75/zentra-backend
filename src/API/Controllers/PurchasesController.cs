using Microsoft.AspNetCore.Mvc;
using MediatR;
using Application.Purchases.Commands;
using Application.Purchases.Queries;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PurchasesController : ControllerBase
    {
        private readonly IMediator _mediator;
        public PurchasesController(IMediator mediator) => _mediator = mediator;

        [HttpGet]
        public async Task<List<PurchaseDto>> GetAll([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            return await _mediator.Send(new GetPurchasesQuery(from, to));
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreatePurchaseCommand command)
        {
            return await _mediator.Send(command);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            await _mediator.Send(new DeletePurchaseCommand(id));
            return NoContent();
        }
    }
}