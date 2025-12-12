using MediatR;
using Domain.Entities;
using Application.Common.Interfaces;
using Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Application.Purchases.Commands
{
    // --- DTOs ---
    public class PurchaseItemDto
    {
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitCost { get; set; } 
    }

    // --- COMMAND ---
    public class CreatePurchaseCommand : IRequest<Guid>
    {
        public Guid SupplierId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty; 
        public string PaymentMethod { get; set; } = "Cash"; 
        public decimal AmountPaid { get; set; }
        public List<PurchaseItemDto> Items { get; set; } = new();
    }

    // --- HANDLER ---
    public class CreatePurchaseCommandHandler : IRequestHandler<CreatePurchaseCommand, Guid>
    {
        private readonly IApplicationDbContext _context;
        public CreatePurchaseCommandHandler(IApplicationDbContext context) => _context = context;

        public async Task<Guid> Handle(CreatePurchaseCommand request, CancellationToken token)
        {
            // 1. Validate Supplier
            var supplier = await _context.Suppliers.FindAsync(new object[] { request.SupplierId }, token);
            if (supplier == null) throw new NotFoundException("Supplier", request.SupplierId);

            var purchase = new Purchase
            {
                SupplierId = request.SupplierId,
                InvoiceNumber = request.InvoiceNumber,
                PaymentMethod = request.PaymentMethod,
                AmountPaid = request.AmountPaid,
                Date = DateTime.UtcNow,
                Status = "Received",
                Items = new List<PurchaseItem>()
            };

            decimal totalBillAmount = 0;

            // 2. Process Items (Stock & Cost Update)
            foreach (var item in request.Items)
            {
                var product = await _context.Products.FindAsync(new object[] { item.ProductId }, token);
                if (product == null) throw new NotFoundException("Product", item.ProductId);

                // A. Update Stock
                product.StockQuantity += item.Quantity; 

                // B. Update Cost Price (Latest Price)
                product.CostPrice = item.UnitCost; 

                var purchaseItem = new PurchaseItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitCost = item.UnitCost
                };
                
                totalBillAmount += purchaseItem.TotalCost;
                purchase.Items.Add(purchaseItem);
            }

            purchase.TotalAmount = totalBillAmount;

            // 3. HANDLE SUPPLIER DEBT (THE FIX)
            // Logic: Total Bill - Amount Paid = Remaining Balance.
            // This runs for ANY payment method (Cash, Bank, or Credit).
            decimal pendingAmount = totalBillAmount - request.AmountPaid;

            if (pendingAmount > 0)
            {
                // We owe the supplier this money
                supplier.Balance += pendingAmount;
            }

            _context.Purchases.Add(purchase);
            await _context.SaveChangesAsync(token);

            return purchase.Id;
        }
    }
}