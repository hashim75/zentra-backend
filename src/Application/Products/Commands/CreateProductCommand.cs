using MediatR;
using Domain.Entities;
using Application.Common.Interfaces;
using Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Application.Products.Commands // Simplified Namespace
{
    public class CreateProductCommand : IRequest<Guid>
    {
        // --- Required Fields ---
        public string Name { get; set; } = string.Empty;
        public string Barcode { get; set; } = string.Empty;
        public decimal SalePrice { get; set; }
        public decimal CostPrice { get; set; }
        public int StockQuantity { get; set; }
        public Guid CategoryId { get; set; }

        // --- Optional Fields (Added for One-Step Creation) ---
        public string? SKU { get; set; } // Can be null
        public int LowStockAlert { get; set; } = 5; // Default to 5 if user doesn't say
        public bool IsExpireable { get; set; } = false;
        public DateTime? ExpiryDate { get; set; } // Nullable Date
    }

    public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Guid>
    {
        private readonly IApplicationDbContext _context;

        public CreateProductCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> Handle(CreateProductCommand request, CancellationToken cancellationToken)
        {
            // 1. Validation Logic
            var category = await _context.Categories.FindAsync(new object[] { request.CategoryId }, cancellationToken);
            if (category == null) throw new ValidationException("Invalid Category ID.");

            // Check Duplicate Barcode
            bool barcodeExists = await _context.Products.AnyAsync(p => p.Barcode == request.Barcode, cancellationToken);
            if (barcodeExists) throw new ValidationException("Product with this Barcode already exists.");

            // 2. Map ALL fields to the Entity
            var entity = new Product
            {
                Name = request.Name,
                Barcode = request.Barcode,
                SalePrice = request.SalePrice,
                CostPrice = request.CostPrice,
                StockQuantity = request.StockQuantity,
                CategoryId = request.CategoryId,

                // Map New Fields
                // If SKU is null, we save "" (empty string) to keep database clean
                SKU = request.SKU ?? string.Empty, 
                LowStockAlert = request.LowStockAlert,
                IsExpireable = request.IsExpireable,
                ExpiryDate = request.ExpiryDate
            };

            // 3. Save
            _context.Products.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return entity.Id;
        }
    }
}