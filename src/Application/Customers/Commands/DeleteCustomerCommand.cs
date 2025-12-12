using MediatR;
using Application.Common.Interfaces;
using Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Application.Customers.Commands.DeleteCustomer
{
    public record DeleteCustomerCommand(Guid Id) : IRequest;

    public class DeleteCustomerCommandHandler : IRequestHandler<DeleteCustomerCommand>
    {
        private readonly IApplicationDbContext _context;
        public DeleteCustomerCommandHandler(IApplicationDbContext context) => _context = context;

        public async Task Handle(DeleteCustomerCommand request, CancellationToken token)
        {
            var entity = await _context.Customers.FindAsync(new object[] { request.Id }, token);
            if (entity == null) throw new NotFoundException("Customer", request.Id);

            // TEST CASE: Do they owe money?
            if (entity.CreditBalance > 0)
                throw new ValidationException($"Cannot delete customer. They still owe {entity.CreditBalance} PKR.");

            // TEST CASE: Do they have past invoices? (History)
            bool hasInvoices = await _context.Invoices.AnyAsync(i => i.CustomerId == request.Id, token);
            if (hasInvoices)
                throw new ValidationException("Cannot delete customer with sales history. You can rename them to 'Inactive'.");

            _context.Customers.Remove(entity);
            await _context.SaveChangesAsync(token);
        }
    }
}