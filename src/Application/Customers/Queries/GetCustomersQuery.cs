using MediatR;
using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AutoMapper.QueryableExtensions;

namespace Application.Customers.Queries
{
    public record GetCustomersQuery(string? SearchTerm) : IRequest<List<CustomerDto>>;

    public class GetCustomersQueryHandler : IRequestHandler<GetCustomersQuery, List<CustomerDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetCustomersQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<CustomerDto>> Handle(GetCustomersQuery request, CancellationToken token)
        {
            var query = _context.Customers.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                string term = request.SearchTerm.ToLower();
                query = query.Where(c => c.Name.ToLower().Contains(term) || c.PhoneNumber.Contains(term));
            }

            return await query
                .OrderBy(c => c.Name)
                .ProjectTo<CustomerDto>(_mapper.ConfigurationProvider)
                .ToListAsync(token);
        }
    }
}