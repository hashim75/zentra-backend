using MediatR;
using Domain.Entities;
using Application.Common.Interfaces;

namespace Application.Expenses.Commands
{
    public class CreateExpenseCommand : IRequest<Guid>
    {
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Category { get; set; } = "General"; // Rent, Utilities, Salary
        public DateTime Date { get; set; } = DateTime.UtcNow;
    }

    public class CreateExpenseCommandHandler : IRequestHandler<CreateExpenseCommand, Guid>
    {
        private readonly IApplicationDbContext _context;
        public CreateExpenseCommandHandler(IApplicationDbContext context) => _context = context;

        public async Task<Guid> Handle(CreateExpenseCommand request, CancellationToken token)
        {
            var entity = new Expense
            {
                Description = request.Description,
                Amount = request.Amount,
                Category = request.Category,
                Date = request.Date
            };

            _context.Expenses.Add(entity);
            await _context.SaveChangesAsync(token);
            return entity.Id;
        }
    }
}