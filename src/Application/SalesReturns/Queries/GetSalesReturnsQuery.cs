using MediatR;
using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AutoMapper.QueryableExtensions;

namespace Application.SalesReturns.Queries
{
    public record GetSalesReturnsQuery : IRequest<List<SalesReturnDto>>;

    public class GetSalesReturnsQueryHandler : IRequestHandler<GetSalesReturnsQuery, List<SalesReturnDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetSalesReturnsQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<SalesReturnDto>> Handle(GetSalesReturnsQuery request, CancellationToken token)
        {
            return await _context.SalesReturns
                .AsNoTracking()
                .OrderByDescending(r => r.Date)
                .ProjectTo<SalesReturnDto>(_mapper.ConfigurationProvider)
                .ToListAsync(token);
        }
    }
}