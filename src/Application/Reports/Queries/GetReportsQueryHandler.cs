using MediatR;
using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Application.Reports.Queries
{
    public class GetReportsQueryHandler : IRequestHandler<GetReportsQuery, ReportDto>
    {
        private readonly IApplicationDbContext _context;

        public GetReportsQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ReportDto> Handle(GetReportsQuery request, CancellationToken token)
        {
            // 1. Setup Dates
            var fromDate = DateTime.SpecifyKind(request.From.Date, DateTimeKind.Utc);
            var toDate = DateTime.SpecifyKind(request.To.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

            // Previous Period (for Growth Calculation)
            var duration = toDate - fromDate;
            var prevFromDate = fromDate.Subtract(duration);
            var prevToDate = fromDate.AddTicks(-1);

            // --- FETCH DATA (Include Customer!) ---
            var currentInvoices = await _context.Invoices
                .Include(i => i.Items)
                .ThenInclude(it => it.Product)
                .Include(i => i.Customer) // <--- CRITICAL: Load Customer details
                .Where(i => i.Date >= fromDate && i.Date <= toDate)
                .ToListAsync(token);

            var previousRevenue = await _context.Invoices
                .Where(i => i.Date >= prevFromDate && i.Date <= prevToDate)
                .SumAsync(i => i.TotalAmount, token);

            var expenses = await _context.Expenses
                .Where(e => e.Date >= fromDate && e.Date <= toDate)
                .SumAsync(e => e.Amount, token);

            var products = await _context.Products.ToListAsync(token);

            // --- FINANCIALS ---
            decimal totalRevenue = currentInvoices.Sum(i => i.TotalAmount);
            int totalTxns = currentInvoices.Count;

            decimal totalCOGS = 0;
            foreach(var inv in currentInvoices) {
                foreach(var item in inv.Items) {
                    if(item.Product != null) {
                        decimal cost = item.Product.CostPrice > item.Product.SalePrice ? 0 : item.Product.CostPrice;
                        totalCOGS += (cost * item.Quantity);
                    }
                }
            }
            decimal totalProfit = (totalRevenue - totalCOGS) - expenses;

            // --- SCALING INSIGHTS ---
            
            // 1. Growth %
            decimal growth = 0;
            if (previousRevenue > 0)
                growth = ((totalRevenue - previousRevenue) / previousRevenue) * 100;
            else if (totalRevenue > 0)
                growth = 100;

            // 2. Average Basket
            decimal avgBasket = totalTxns > 0 ? totalRevenue / totalTxns : 0;

            // 3. Customer Retention (FIXED)
            // We use i.Customer.Id or i.Customer.Name safely
            var customerGroups = currentInvoices
                .Where(i => i.Customer != null) // Only count linked customers
                .GroupBy(i => i.Customer!.Id)
                .ToList();
            
            int totalUniqueCustomers = customerGroups.Count;
            int returningCustomers = customerGroups.Count(g => g.Count() > 1);
            
            decimal retentionRate = totalUniqueCustomers > 0 
                ? ((decimal)returningCustomers / totalUniqueCustomers) * 100 
                : 0;

            // --- VISUALIZATION DATA ---
            
            decimal inventoryCost = products.Sum(p => p.StockQuantity * p.CostPrice);
            decimal potentialRevenue = products.Sum(p => p.StockQuantity * p.SalePrice);

            // Peak Hours
            var peakHours = currentInvoices
                .GroupBy(i => i.Date.ToLocalTime().Hour)
                .Select(g => new HourlySalesDto 
                { 
                    Hour = $"{g.Key:00}:00", 
                    Amount = g.Sum(i => i.TotalAmount),
                    Count = g.Count()
                })
                .OrderBy(x => x.Hour)
                .ToList();

            // Profit Matrix
            var productStats = currentInvoices.SelectMany(i => i.Items)
                .GroupBy(x => x.ProductName)
                .Select(g => 
                {
                    var sample = g.First();
                    decimal cost = sample.Product?.CostPrice ?? 0;
                    decimal price = sample.UnitPrice;
                    decimal marginPct = price > 0 ? ((price - cost) / price) * 100 : 0;
                    int qty = g.Sum(x => x.Quantity);

                    string cat = "Standard";
                    if (marginPct > 30 && qty > 5) cat = "Star";
                    else if (marginPct < 15 && qty > 5) cat = "Volume";
                    else if (marginPct < 15 && qty < 5) cat = "Loss";
                    else if (marginPct > 30 && qty < 5) cat = "Potential";

                    return new ProductPerformanceDto
                    {
                        Name = g.Key,
                        Sold = qty,
                        Revenue = g.Sum(x => x.Quantity * x.UnitPrice),
                        Margin = Math.Round(marginPct, 1),
                        Category = cat
                    };
                })
                .OrderByDescending(x => x.Revenue)
                .Take(50)
                .ToList();

            // VIP Customers (FIXED)
            // Use i.Customer?.Name and fallback to "Walking Customer"
            var topCustomers = currentInvoices
                .GroupBy(i => i.Customer != null ? i.Customer.Name : "Walking Customer")
                .Where(g => g.Key != "Walking Customer") // Exclude walking customers from VIP list
                .Select(g => new CustomerInsightDto
                {
                    Name = g.Key,
                    Visits = g.Count(),
                    Spent = g.Sum(i => i.TotalAmount)
                })
                .OrderByDescending(x => x.Spent)
                .Take(5)
                .ToList();

            return new ReportDto
            {
                TotalRevenue = totalRevenue,
                TotalExpenses = expenses,
                NetCashFlow = totalRevenue - expenses,
                TotalProfit = totalProfit,
                
                SalesGrowthPercentage = Math.Round(growth, 1),
                AverageBasketValue = Math.Round(avgBasket, 0),
                CustomerRetentionRate = Math.Round(retentionRate, 1),
                TotalTransactions = totalTxns,

                InventoryCostValue = inventoryCost,
                ProjectedProfitValue = potentialRevenue - inventoryCost,
                PeakHours = peakHours,
                ProductPerformance = productStats,
                TopCustomers = topCustomers
            };
        }
    }
}