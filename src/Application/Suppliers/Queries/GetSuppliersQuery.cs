using MediatR;
using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AutoMapper.QueryableExtensions;

namespace Application.Suppliers.Queries
{
    public record GetSuppliersQuery(string? SearchTerm) : IRequest<List<SupplierDto>>;

    public class GetSuppliersQueryHandler : IRequestHandler<GetSuppliersQuery, List<SupplierDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetSuppliersQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<SupplierDto>> Handle(GetSuppliersQuery request, CancellationToken token)
        {
            var query = _context.Suppliers.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                string term = request.SearchTerm.ToLower();
                query = query.Where(s => s.Name.ToLower().Contains(term) || s.PhoneNumber.Contains(term));
            }

            return await query
                .OrderBy(s => s.Name)
                .ProjectTo<SupplierDto>(_mapper.ConfigurationProvider)
                .ToListAsync(token);
        }
    }
}