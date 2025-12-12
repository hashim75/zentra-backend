using MediatR;
using Application.Common.Interfaces;
using Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Application.Products.Commands.UpdateProduct
{
    public record UpdateProductCommand : IRequest
    {
        public Guid Id { get; init; }
        // Fix: Add defaults to remove warnings
        public string Name { get; init; } = string.Empty; 
        public string Barcode { get; init; } = string.Empty;
        public decimal SalePrice { get; init; }
        public decimal CostPrice { get; init; }
        public int StockQuantity { get; init; }
        public int LowStockAlert { get; init; }
        public Guid CategoryId { get; init; }
    }

    public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand>
    {
        private readonly IApplicationDbContext _context;
        public UpdateProductCommandHandler(IApplicationDbContext context) => _context = context;

        public async Task Handle(UpdateProductCommand request, CancellationToken token)
        {
            var entity = await _context.Products.FindAsync(new object[] { request.Id }, token);
            if (entity == null) throw new NotFoundException("Product", request.Id);

            if (request.Barcode != entity.Barcode)
            {
                bool barcodeExists = await _context.Products.AnyAsync(p => p.Barcode == request.Barcode, token);
                if (barcodeExists) throw new ValidationException("Barcode already taken by another product.");
            }

            entity.Name = request.Name;
            entity.Barcode = request.Barcode;
            entity.SalePrice = request.SalePrice;
            entity.CostPrice = request.CostPrice;
            entity.StockQuantity = request.StockQuantity;
            entity.LowStockAlert = request.LowStockAlert;
            entity.CategoryId = request.CategoryId;

            await _context.SaveChangesAsync(token);
        }
    }
}