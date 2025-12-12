using MediatR;
using Domain.Entities;
using Application.Common.Interfaces;

namespace Application.Customers.Commands // <--- Simplified Namespace
{
    public record CreateCustomerCommand : IRequest<Guid>
    {
        public string Name { get; init; } = string.Empty;
        public string PhoneNumber { get; init; } = string.Empty;
        public decimal CreditLimit { get; init; } = 50000;
    }

    public class CreateCustomerCommandHandler : IRequestHandler<CreateCustomerCommand, Guid>
    {
        private readonly IApplicationDbContext _context;

        public CreateCustomerCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> Handle(CreateCustomerCommand request, CancellationToken cancellationToken)
        {
            var entity = new Customer
            {
                Name = request.Name,
                PhoneNumber = request.PhoneNumber,
                CreditLimit = request.CreditLimit,
                CreditBalance = 0,
                IsBadDebtor = false
            };

            _context.Customers.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return entity.Id;
        }
    }
}