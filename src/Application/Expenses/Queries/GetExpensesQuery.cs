using MediatR;
using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AutoMapper.QueryableExtensions;

namespace Application.Expenses.Queries
{
    public record GetExpensesQuery(DateTime? FromDate, DateTime? ToDate) : IRequest<List<ExpenseDto>>;

    public class GetExpensesQueryHandler : IRequestHandler<GetExpensesQuery, List<ExpenseDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetExpensesQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<ExpenseDto>> Handle(GetExpensesQuery request, CancellationToken token)
        {
            var query = _context.Expenses.AsNoTracking();

            if (request.FromDate.HasValue)
                query = query.Where(e => e.Date >= request.FromDate);
            
            if (request.ToDate.HasValue)
                query = query.Where(e => e.Date <= request.ToDate);

            return await query
                .OrderByDescending(e => e.Date)
                .ProjectTo<ExpenseDto>(_mapper.ConfigurationProvider)
                .ToListAsync(token);
        }
    }
}