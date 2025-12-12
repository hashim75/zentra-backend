using MediatR;
using Application.Common.Interfaces;
using Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Application.Purchases.Commands
{
    public record DeletePurchaseCommand(Guid Id) : IRequest;

    public class DeletePurchaseCommandHandler : IRequestHandler<DeletePurchaseCommand>
    {
        private readonly IApplicationDbContext _context;
        public DeletePurchaseCommandHandler(IApplicationDbContext context) => _context = context;

        public async Task Handle(DeletePurchaseCommand request, CancellationToken token)
        {
            var purchase = await _context.Purchases
                .Include(p => p.Items) // Must load items to know what to reverse
                .FirstOrDefaultAsync(p => p.Id == request.Id, token);

            if (purchase == null) throw new NotFoundException("Purchase", request.Id);

            // 1. REVERSE INVENTORY
            foreach (var item in purchase.Items)
            {
                var product = await _context.Products.FindAsync(new object[] { item.ProductId }, token);
                if (product != null)
                {
                    // Validation: Do we have enough stock to return?
                    if (product.StockQuantity < item.Quantity)
                    {
                        throw new ValidationException($"Cannot delete purchase. Item '{product.Name}' has already been sold. Current Stock: {product.StockQuantity}, Required to Reverse: {item.Quantity}");
                    }
                    product.StockQuantity -= item.Quantity; // Stock goes DOWN
                }
            }

            // 2. REVERSE SUPPLIER DEBT
            if (purchase.PaymentMethod == "Credit")
            {
                var supplier = await _context.Suppliers.FindAsync(new object[] { purchase.SupplierId }, token);
                if (supplier != null)
                {
                    decimal debtAmount = purchase.TotalAmount - purchase.AmountPaid;
                    supplier.Balance -= debtAmount; // Reduce debt
                }
            }

            _context.Purchases.Remove(purchase);
            await _context.SaveChangesAsync(token);
        }
    }
}