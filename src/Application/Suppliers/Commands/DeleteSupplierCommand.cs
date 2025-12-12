using MediatR;
using Application.Common.Interfaces;
using Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Application.Suppliers.Commands
{
    public record DeleteSupplierCommand(Guid Id) : IRequest;

    public class DeleteSupplierCommandHandler : IRequestHandler<DeleteSupplierCommand>
    {
        private readonly IApplicationDbContext _context;
        public DeleteSupplierCommandHandler(IApplicationDbContext context) => _context = context;

        public async Task Handle(DeleteSupplierCommand request, CancellationToken token)
        {
            var entity = await _context.Suppliers.FindAsync(new object[] { request.Id }, token);
            if (entity == null) throw new NotFoundException("Supplier", request.Id);

            // TESTER RULE 1: Do we owe them money?
            if (entity.Balance > 0)
                throw new ValidationException($"Cannot delete supplier. You owe them {entity.Balance} PKR.");

            // TESTER RULE 2: History check
            bool hasPurchases = await _context.Purchases.AnyAsync(p => p.SupplierId == request.Id, token);
            if (hasPurchases)
                throw new ValidationException("Cannot delete supplier. They have purchase records.");

            _context.Suppliers.Remove(entity);
            await _context.SaveChangesAsync(token);
        }
    }
}