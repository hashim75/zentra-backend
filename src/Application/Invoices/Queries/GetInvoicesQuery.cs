using MediatR;
using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AutoMapper.QueryableExtensions;

namespace Application.Invoices.Queries
{
    public record GetInvoicesQuery(DateTime? FromDate, DateTime? ToDate) : IRequest<List<InvoiceDto>>;

    public class GetInvoicesQueryHandler : IRequestHandler<GetInvoicesQuery, List<InvoiceDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetInvoicesQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<InvoiceDto>> Handle(GetInvoicesQuery request, CancellationToken token)
        {
            var query = _context.Invoices.AsNoTracking();

            if (request.FromDate.HasValue)
                query = query.Where(i => i.Date >= request.FromDate);

            if (request.ToDate.HasValue)
                query = query.Where(i => i.Date <= request.ToDate);

            return await query
                .OrderByDescending(i => i.Date)
                .ProjectTo<InvoiceDto>(_mapper.ConfigurationProvider)
                .ToListAsync(token);
        }
    }
}