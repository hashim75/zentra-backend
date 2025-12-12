using MediatR;
using Application.Common.Interfaces;
using Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Application.Categories.Commands.UpdateCategory
{
    public record UpdateCategoryCommand : IRequest
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = string.Empty;
        public string Description { get; init; } = string.Empty;
    }

    public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand>
    {
        private readonly IApplicationDbContext _context;
        public UpdateCategoryCommandHandler(IApplicationDbContext context) => _context = context;

        public async Task Handle(UpdateCategoryCommand request, CancellationToken token)
        {
            // 1. Find it
            var entity = await _context.Categories.FindAsync(new object[] { request.Id }, token);
            if (entity == null) throw new NotFoundException("Category", request.Id);

            // 2. TEST CASE: Duplicate Name Check?
            // "If I rename 'Medicine' to 'Snacks', but 'Snacks' already exists, stop me."
            bool exists = await _context.Categories
                .AnyAsync(c => c.Name == request.Name && c.Id != request.Id, token);
            
            if (exists) throw new ValidationException("A category with this name already exists.");

            // 3. Update
            entity.Name = request.Name;
            entity.Description = request.Description;

            await _context.SaveChangesAsync(token);
        }
    }
}