using MediatR;
using Application.Common.Interfaces;
using Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Application.Categories.Commands.DeleteCategory
{
    public record DeleteCategoryCommand(Guid Id) : IRequest;

    public class DeleteCategoryCommandHandler : IRequestHandler<DeleteCategoryCommand>
    {
        private readonly IApplicationDbContext _context;
        public DeleteCategoryCommandHandler(IApplicationDbContext context) => _context = context;

        public async Task Handle(DeleteCategoryCommand request, CancellationToken token)
        {
            var entity = await _context.Categories.FindAsync(new object[] { request.Id }, token);
            if (entity == null) throw new NotFoundException("Category", request.Id);

            // TEST CASE: Does it have products?
            // "If I delete 'Medicine', what happens to 'Panadol'?"
            bool hasProducts = await _context.Products.AnyAsync(p => p.CategoryId == request.Id, token);
            if (hasProducts) 
                throw new ValidationException("Cannot delete this category because it contains products. Delete the products first.");

            _context.Categories.Remove(entity);
            await _context.SaveChangesAsync(token);
        }
    }
}