using Domain.Entities;
using MediatR;
using Application.Common.Interfaces;

namespace Application.Customers.Commands.UpdateCustomer
{
    public class UpdateCustomerCommandHandler : IRequestHandler<UpdateCustomerCommand>
    {
        private readonly IApplicationDbContext _context;

        public UpdateCustomerCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task Handle(UpdateCustomerCommand request, CancellationToken token)
        {
            var entity = await _context.Customers
                .FindAsync(new object[] { request.Id }, token);

            if (entity == null)
            {
                throw new KeyNotFoundException($"Customer {request.Id} not found.");
            }

            // Update all fields
            entity.Name = request.Name;
            entity.PhoneNumber = request.PhoneNumber;
            entity.CreditBalance = request.CreditBalance; // The critical fix

            await _context.SaveChangesAsync(token);
        }
    }
}