using Domain.Entities;
using Domain.Common;
using Microsoft.EntityFrameworkCore;
using Application.Common.Interfaces;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace Infrastructure.Persistence
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
    {
        private readonly ICurrentUserService _currentUserService;

        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options,
            ICurrentUserService currentUserService)
            : base(options)
        {
            _currentUserService = currentUserService;
        }

        // --- TABLES ---
        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        
        // New Tables
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<Purchase> Purchases { get; set; }
        public DbSet<PurchaseItem> PurchaseItems { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<SalesReturn> SalesReturns { get; set; }
        public DbSet<SalesReturnItem> SalesReturnItems { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

            // --- MULTI-TENANCY FILTERS ---
            // Security: Always check who is logged in!
            builder.Entity<Product>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId);
            builder.Entity<Category>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId);
            builder.Entity<Customer>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId);
            builder.Entity<Invoice>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId);
            builder.Entity<InvoiceItem>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId);
            builder.Entity<AuditLog>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId);

            // New Filters
            builder.Entity<Supplier>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId);
            builder.Entity<Purchase>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId);
            builder.Entity<PurchaseItem>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId);
            builder.Entity<Expense>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId);
            builder.Entity<SalesReturn>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId);
            builder.Entity<SalesReturnItem>().HasQueryFilter(x => x.TenantId == _currentUserService.TenantId);
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
        {
            string? currentTenantId = _currentUserService.TenantId;

            foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.TenantId = currentTenantId ?? string.Empty;
                }
            }

            return await base.SaveChangesAsync(cancellationToken);
        }
    }
}