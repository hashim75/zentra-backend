using MediatR;
using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AutoMapper.QueryableExtensions;

namespace Application.Purchases.Queries
{
    public record GetPurchasesQuery(DateTime? FromDate, DateTime? ToDate) : IRequest<List<PurchaseDto>>;

    public class GetPurchasesQueryHandler : IRequestHandler<GetPurchasesQuery, List<PurchaseDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetPurchasesQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<PurchaseDto>> Handle(GetPurchasesQuery request, CancellationToken token)
        {
            var query = _context.Purchases.AsNoTracking();

            if (request.FromDate.HasValue)
                query = query.Where(p => p.Date >= request.FromDate.Value);

            if (request.ToDate.HasValue)
                query = query.Where(p => p.Date <= request.ToDate.Value);

            return await query
                .OrderByDescending(p => p.Date)
                .ProjectTo<PurchaseDto>(_mapper.ConfigurationProvider)
                .ToListAsync(token);
        }
    }
}