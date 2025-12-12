using MediatR;
using Application.Common.Interfaces;
using Application.Common.Exceptions;

namespace Application.Expenses.Commands
{
    public record DeleteExpenseCommand(Guid Id) : IRequest;

    public class DeleteExpenseCommandHandler : IRequestHandler<DeleteExpenseCommand>
    {
        private readonly IApplicationDbContext _context;
        public DeleteExpenseCommandHandler(IApplicationDbContext context) => _context = context;

        public async Task Handle(DeleteExpenseCommand request, CancellationToken token)
        {
            var entity = await _context.Expenses.FindAsync(new object[] { request.Id }, token);
            if (entity == null) throw new NotFoundException("Expense", request.Id);

            _context.Expenses.Remove(entity);
            await _context.SaveChangesAsync(token);
        }
    }
}