using Domain.Entities;
using MediatR;
using Application.Common.Interfaces;
using Application.Common.Exceptions;

namespace Application.Suppliers.Commands
{
    // 1. The Data (Envelope)
    public class PaySupplierCommand : IRequest<Unit>
    {
        public Guid SupplierId { get; set; }
        public decimal Amount { get; set; } // The amount we are paying them
    }

    // 2. The Logic (Processor)
    public class PaySupplierCommandHandler : IRequestHandler<PaySupplierCommand, Unit>
    {
        private readonly IApplicationDbContext _context;

        public PaySupplierCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Unit> Handle(PaySupplierCommand request, CancellationToken token)
        {
            var supplier = await _context.Suppliers.FindAsync(new object[] { request.SupplierId }, token);
            
            if (supplier == null)
            {
                throw new NotFoundException("Supplier", request.SupplierId);
            }

            // --- THE LOGIC ---
            // We are giving money, so our Debt (Balance) goes DOWN.
            supplier.Balance -= request.Amount; 

            // Prevent negative balance (Optional: remove this if you want to allow advance payments)
            if (supplier.Balance < 0) supplier.Balance = 0; 

            await _context.SaveChangesAsync(token);
            
            return Unit.Value;
        }
    }
}