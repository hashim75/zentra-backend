using MediatR;
using Domain.Entities;
using Application.Common.Interfaces;
using Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Application.Invoices.Commands.CreateInvoice
{
    // --- 1. THE DTOs (Must be visible) ---
    public class CartItemDto
    {
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
    }

    // --- 2. THE COMMAND (Must be visible) ---
    public record CreateInvoiceCommand : IRequest<Guid>
    {
        public Guid? CustomerId { get; init; }
        public string PaymentMethod { get; init; } = "Cash"; 
        public decimal DiscountAmount { get; init; }
        public decimal PaidAmount { get; init; }
        public List<CartItemDto> Items { get; init; } = new();
    }

    // --- 3. THE HANDLER ---
    public class CreateInvoiceCommandHandler : IRequestHandler<CreateInvoiceCommand, Guid>
    {
        private readonly IApplicationDbContext _context;
        public CreateInvoiceCommandHandler(IApplicationDbContext context) => _context = context;

        public async Task<Guid> Handle(CreateInvoiceCommand request, CancellationToken token)
        {
            // 1. Calculate Paid Amount (Credit = 0 paid now)
            decimal actualPaidAmount = request.PaymentMethod == "Credit" ? 0 : request.PaidAmount;

            var invoice = new Invoice
            {
                CustomerId = request.CustomerId,
                Date = DateTime.UtcNow,
                InvoiceNumber = "INV-" + DateTime.UtcNow.Ticks.ToString().Substring(10),
                PaymentMethod = request.PaymentMethod,
                DiscountAmount = request.DiscountAmount,
                PaidAmount = actualPaidAmount,
                Status = "Completed", 
                IsSyncedToCloud = false
            };

            decimal calculatedTotal = 0;

            // 2. Process Items
            foreach (var item in request.Items)
            {
                var product = await _context.Products.FindAsync(new object[] { item.ProductId }, token);
                
                if (product == null) throw new NotFoundException("Product", item.ProductId);

                if (product.StockQuantity < item.Quantity)
                {
                    throw new ValidationException($"Not enough stock for '{product.Name}'. Available: {product.StockQuantity}");
                }

                // Deduct Stock
                product.StockQuantity -= item.Quantity;

                var invoiceItem = new InvoiceItem
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    Quantity = item.Quantity,
                    UnitPrice = product.SalePrice,
                    InvoiceId = invoice.Id
                };
                
                calculatedTotal += (invoiceItem.Quantity * invoiceItem.UnitPrice);
                _context.InvoiceItems.Add(invoiceItem);
            }

            // 3. Final Calculations
            invoice.TotalAmount = calculatedTotal;
            invoice.NetAmount = calculatedTotal - request.DiscountAmount;
            
            // Calculate Change
            invoice.ChangeGiven = actualPaidAmount - invoice.NetAmount;
            if (invoice.ChangeGiven < 0) invoice.ChangeGiven = 0;

            // 4. Handle Credit (Udhaar)
            if (request.PaymentMethod == "Credit")
            {
                if (request.CustomerId == null)
                    throw new ValidationException("Customer is required for Credit sales.");

                var customer = await _context.Customers.FindAsync(new object[] { request.CustomerId }, token);
                
                if (customer != null)
                {
                    customer.CreditBalance += invoice.NetAmount; // Increase Debt
                }
            }

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync(token);

            return invoice.Id;
        }
    }
}