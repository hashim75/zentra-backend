using Microsoft.AspNetCore.Mvc;
using MediatR;
using Application.Categories.Commands;
using Application.Categories.Commands.UpdateCategory;
using Application.Categories.Commands.DeleteCategory;
using Application.Categories.Queries;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly IMediator _mediator;
        public CategoriesController(IMediator mediator) => _mediator = mediator;

        [HttpGet]
        public async Task<List<CategoryDto>> GetAll()
        {
            return await _mediator.Send(new GetCategoriesQuery());
        }

        [HttpPost]
        public async Task<ActionResult<Guid>> Create(CreateCategoryCommand command)
        {
            return await _mediator.Send(command);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(Guid id, UpdateCategoryCommand command)
        {
            if (id != command.Id) return BadRequest();
            await _mediator.Send(command);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            await _mediator.Send(new DeleteCategoryCommand(id));
            return NoContent();
        }
    }
}