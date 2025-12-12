using MediatR;
using Domain.Entities;
using Application.Common.Interfaces;
using Application.Common.Exceptions;

namespace Application.SalesReturns.Commands
{
    // DTO for the items being returned
    public class ReturnItemDto
    {
        public Guid ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal RefundAmount { get; set; }
    }

    // The Main Command
    public class CreateSalesReturnCommand : IRequest<Guid>
    {
        public string Reason { get; set; } = string.Empty;
        public List<ReturnItemDto> Items { get; set; } = new();
    }

    // The Handler
    public class CreateSalesReturnCommandHandler : IRequestHandler<CreateSalesReturnCommand, Guid>
    {
        private readonly IApplicationDbContext _context;
        public CreateSalesReturnCommandHandler(IApplicationDbContext context) => _context = context;

        public async Task<Guid> Handle(CreateSalesReturnCommand request, CancellationToken token)
        {
            var salesReturn = new SalesReturn
            {
                Reason = request.Reason,
                Date = DateTime.UtcNow,
                RefundAmount = 0
            };

            foreach (var item in request.Items)
            {
                var product = await _context.Products.FindAsync(new object[] { item.ProductId }, token);
                if (product == null) throw new NotFoundException("Product", item.ProductId);

                // 1. RESTOCK (Item comes back to shelf)
                product.StockQuantity += item.Quantity;

                var returnItem = new SalesReturnItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    RefundAmount = item.RefundAmount
                };
                
                salesReturn.RefundAmount += item.RefundAmount;
                salesReturn.Items.Add(returnItem);
            }

            _context.SalesReturns.Add(salesReturn);
            await _context.SaveChangesAsync(token);

            return salesReturn.Id;
        }
    }
}