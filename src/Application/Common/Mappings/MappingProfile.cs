using AutoMapper;
using Domain.Entities;
using Application.Products.Queries;
using Application.Categories.Queries;
using Application.Customers.Queries;
using Application.Suppliers.Queries;
using Application.Invoices.Queries;
using Application.Purchases.Queries;
using Application.Expenses.Queries;
using Application.SalesReturns.Queries;
using Application.AuditLogs.Queries;

namespace Application.Common.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // 1. Product
            CreateMap<Product, ProductDto>()
                .ForMember(d => d.CategoryName, opt => opt.MapFrom(s => s.Category != null ? s.Category.Name : ""));

            // 2. Category
            CreateMap<Category, CategoryDto>()
                .ForMember(d => d.ProductCount, opt => opt.MapFrom(s => s.Products.Count));

            // 3. Customer
            CreateMap<Customer, CustomerDto>();

            // 4. Supplier
            CreateMap<Supplier, SupplierDto>();

            // 5. Invoice (and Items)
            CreateMap<InvoiceItem, InvoiceItemDto>();
            CreateMap<Invoice, InvoiceDto>()
                .ForMember(d => d.CustomerName, opt => opt.MapFrom(s => s.Customer != null ? s.Customer.Name : "Walking Customer"));

            // 6. Purchase
            CreateMap<Purchase, PurchaseDto>()
                .ForMember(d => d.SupplierName, opt => opt.MapFrom(s => s.Supplier != null ? s.Supplier.Name : "Unknown"));

            // 7. Sales Return
            CreateMap<SalesReturn, SalesReturnDto>()
                .ForMember(d => d.ItemCount, opt => opt.MapFrom(s => s.Items.Count));

            // 8. Expense
            CreateMap<Expense, ExpenseDto>();

            // 9. Audit Log
            CreateMap<AuditLog, AuditLogDto>();
        }
    }
}