using MediatR;
using Application.Common.Interfaces;
using Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Application.Suppliers.Commands
{
    public class UpdateSupplierCommand : IRequest
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
    }

    public class UpdateSupplierCommandHandler : IRequestHandler<UpdateSupplierCommand>
    {
        private readonly IApplicationDbContext _context;
        public UpdateSupplierCommandHandler(IApplicationDbContext context) => _context = context;

        public async Task Handle(UpdateSupplierCommand request, CancellationToken token)
        {
            var entity = await _context.Suppliers.FindAsync(new object[] { request.Id }, token);
            if (entity == null) throw new NotFoundException("Supplier", request.Id);

            // TESTER: Duplicate Name Check (excluding self)
            bool exists = await _context.Suppliers.AnyAsync(s => s.Name == request.Name && s.Id != request.Id, token);
            if (exists) throw new ValidationException("Another supplier with this name already exists.");

            entity.Name = request.Name;
            entity.ContactPerson = request.ContactPerson;
            entity.PhoneNumber = request.PhoneNumber;

            await _context.SaveChangesAsync(token);
        }
    }
}