using Microsoft.AspNetCore.Mvc;
using MediatR;
using Application.Suppliers.Commands;
using Application.Suppliers.Queries;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SuppliersController : ControllerBase
    {
        private readonly IMediator _mediator;
        public SuppliersController(IMediator mediator) => _mediator = mediator;

        [HttpGet]
        public async Task<List<SupplierDto>> GetAll([FromQuery] string? search)
        {
            return await _mediator.Send(new GetSuppliersQuery(search));
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateSupplierCommand command)
        {
            return await _mediator.Send(command);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(Guid id, UpdateSupplierCommand command)
        {
            if (id != command.Id) return BadRequest();
            await _mediator.Send(command);
            return NoContent();
        }
        [HttpPost("pay")]
public async Task<ActionResult> PaySupplier(PaySupplierCommand command)
{
    await _mediator.Send(command);
    return NoContent();
}

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> Delete(Guid id)
        {
            await _mediator.Send(new DeleteSupplierCommand(id));
            return NoContent();
        }
    }
}