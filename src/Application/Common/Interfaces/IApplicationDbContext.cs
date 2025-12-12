using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Application.Common.Interfaces
{
    public interface IApplicationDbContext
    {
        // Existing
        DbSet<Product> Products { get; }
        DbSet<Category> Categories { get; }
        DbSet<Customer> Customers { get; }
        DbSet<Invoice> Invoices { get; }
        DbSet<InvoiceItem> InvoiceItems { get; }
        DbSet<AuditLog> AuditLogs { get; }

        // --- NEW FEATURES ---
        DbSet<Supplier> Suppliers { get; }
        DbSet<Purchase> Purchases { get; }
        DbSet<PurchaseItem> PurchaseItems { get; }
        DbSet<Expense> Expenses { get; }
        DbSet<SalesReturn> SalesReturns { get; }
        DbSet<SalesReturnItem> SalesReturnItems { get; }
        // --------------------

        Task<int> SaveChangesAsync(CancellationToken cancellationToken);
    }
}