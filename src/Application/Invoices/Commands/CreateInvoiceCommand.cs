using MediatR;
using Application.Common.Interfaces;
using Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Application.Invoices.Commands
{
    // 1. The Request Object
    public class ReturnInvoiceCommand : IRequest<Unit>
    {
        public Guid InvoiceId { get; set; }
    }

    // 2. The Logic Handler
    public class ReturnInvoiceCommandHandler : IRequestHandler<ReturnInvoiceCommand, Unit>
    {
        private readonly IApplicationDbContext _context;

        public ReturnInvoiceCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Unit> Handle(ReturnInvoiceCommand request, CancellationToken token)
        {
            // A. Fetch Invoice with Items and Customer info
            var invoice = await _context.Invoices
                .Include(i => i.Items)
                .Include(i => i.Customer) 
                .FirstOrDefaultAsync(i => i.Id == request.InvoiceId, token);

            if (invoice == null) throw new NotFoundException("Invoice", request.InvoiceId);

            if (invoice.Status == "Returned")
            {
                throw new Exception("This invoice is already returned.");
            }

            // B. Restore Stock (Put items back on the shelf)
            foreach (var item in invoice.Items)
            {
                var product = await _context.Products.FindAsync(new object[] { item.ProductId }, token);
                if (product != null)
                {
                    product.StockQuantity += item.Quantity; // Increase Stock
                }
            }

            // C. Adjust Customer Credit (If they bought on Udhaar)
            // If they paid Cash, we assume you give the cash back physically.
            // If they paid Credit, we must reduce their debt in the system.
            if (invoice.PaymentMethod == "Credit" && invoice.CustomerId != null)
            {
                var customer = await _context.Customers.FindAsync(new object[] { invoice.CustomerId }, token);

                if (customer != null)
                {
                    customer.CreditBalance -= invoice.NetAmount;
                    
                    // Prevent negative balance logic (Optional safety)
                    if (customer.CreditBalance < 0) customer.CreditBalance = 0;
                }
            }

            // D. Mark Invoice as Returned
            invoice.Status = "Returned";

            // E. Audit Log (Security)
            _context.AuditLogs.Add(new Domain.Entities.AuditLog
            {
                Action = "Return",
                Details = $"Invoice {invoice.InvoiceNumber} was returned.",
                Username = "Admin/Staff", 
                IsSuspicious = false
            });

            await _context.SaveChangesAsync(token);

            return Unit.Value;
        }
    }
}