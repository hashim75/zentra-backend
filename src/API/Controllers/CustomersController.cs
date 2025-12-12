using Microsoft.AspNetCore.Mvc;
using MediatR;
using Application.Customers.Commands;
using Application.Customers.Commands.UpdateCustomer;
using Application.Customers.Commands.DeleteCustomer;
using Application.Customers.Queries;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly IMediator _mediator;
        public CustomersController(IMediator mediator) => _mediator = mediator;

        [HttpGet]
        public async Task<List<CustomerDto>> GetAll([FromQuery] string? search)
        {
            return await _mediator.Send(new GetCustomersQuery(search));
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateCustomerCommand command)
        {
            return await _mediator.Send(command);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(Guid id, UpdateCustomerCommand command)
        {
            if (id != command.Id) return BadRequest();
            await _mediator.Send(command);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            await _mediator.Send(new DeleteCustomerCommand(id));
            return NoContent();
        }
    }
}