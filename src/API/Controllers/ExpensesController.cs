using Microsoft.AspNetCore.Mvc;
using MediatR;
using Application.Expenses.Commands;
using Application.Expenses.Queries;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExpensesController : ControllerBase
    {
        private readonly IMediator _mediator;
        public ExpensesController(IMediator mediator) => _mediator = mediator;

        [HttpGet]
        public async Task<List<ExpenseDto>> GetAll([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            return await _mediator.Send(new GetExpensesQuery(from, to));
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateExpenseCommand command)
        {
            return await _mediator.Send(command);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            await _mediator.Send(new DeleteExpenseCommand(id));
            return NoContent();
        }
    }
}