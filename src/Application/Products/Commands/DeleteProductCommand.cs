using MediatR;
using Application.Common.Interfaces;
using Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Application.Products.Commands.DeleteProduct
{
    public record DeleteProductCommand(Guid Id) : IRequest;

    public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand>
    {
        private readonly IApplicationDbContext _context;
        public DeleteProductCommandHandler(IApplicationDbContext context) => _context = context;

        public async Task Handle(DeleteProductCommand request, CancellationToken token)
        {
            var entity = await _context.Products.FindAsync(new object[] { request.Id }, token);
            if (entity == null) throw new NotFoundException("Product", request.Id);

            // TEST CASE: Has it been sold? (Using InvoiceItems)
            bool hasHistory = await _context.InvoiceItems.AnyAsync(i => i.ProductId == request.Id, token);
            if (hasHistory)
                throw new ValidationException("Cannot delete this product because it has sales history. Mark it as inactive instead.");

            _context.Products.Remove(entity);
            await _context.SaveChangesAsync(token);
        }
    }
}