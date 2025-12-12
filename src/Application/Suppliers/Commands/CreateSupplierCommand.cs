using MediatR;
using Domain.Entities;
using Application.Common.Interfaces;
using Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Application.Suppliers.Commands
{
    public class CreateSupplierCommand : IRequest<Guid>
    {
        public string Name { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
    }

    public class CreateSupplierCommandHandler : IRequestHandler<CreateSupplierCommand, Guid>
    {
        private readonly IApplicationDbContext _context;
        public CreateSupplierCommandHandler(IApplicationDbContext context) => _context = context;

        public async Task<Guid> Handle(CreateSupplierCommand request, CancellationToken token)
        {
            // TESTER: Check Duplicate Name
            bool exists = await _context.Suppliers.AnyAsync(s => s.Name == request.Name, token);
            if (exists) throw new ValidationException("Supplier with this name already exists.");

            var entity = new Supplier
            {
                Name = request.Name,
                ContactPerson = request.ContactPerson,
                PhoneNumber = request.PhoneNumber,
                Balance = 0 // Starts at 0
            };

            _context.Suppliers.Add(entity);
            await _context.SaveChangesAsync(token);

            return entity.Id;
        }
    }
}