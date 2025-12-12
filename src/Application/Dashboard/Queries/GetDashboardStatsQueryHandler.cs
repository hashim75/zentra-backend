using MediatR;
using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Application.Dashboard.Queries
{
    public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
    {
        private readonly IApplicationDbContext _context;

        public GetDashboardStatsQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken token)
        {
            var today = DateTime.UtcNow.Date; 
            var tomorrow = today.AddDays(1);
            var sevenDaysAgo = today.AddDays(-6); 

            // 1. Get Invoices for TODAY
            var todaysInvoices = await _context.Invoices
                .Include(i => i.Items)
                .ThenInclude(it => it.Product)
                .Where(i => i.Date >= today && i.Date < tomorrow)
                .ToListAsync(token);

            // 2. Get Invoices for LAST 7 DAYS
            var weeklyInvoices = await _context.Invoices
                .Include(i => i.Items)
                .ThenInclude(it => it.Product)
                .Where(i => i.Date >= sevenDaysAgo && i.Date < tomorrow)
                .ToListAsync(token);

            // --- CALCULATIONS (TODAY) ---
            decimal totalSales = todaysInvoices.Sum(i => i.TotalAmount);

            decimal totalCostOfGoods = 0;
            foreach (var invoice in todaysInvoices)
            {
                foreach (var item in invoice.Items)
                {
                    if(item.Product != null)
                    {
                        // SAFETY: If Cost > Sale Price, assume 0 to prevent negative profit error
                        decimal safeCost = item.Product.CostPrice > item.Product.SalePrice 
                            ? 0 
                            : item.Product.CostPrice;

                        totalCostOfGoods += (safeCost * item.Quantity);
                    }
                }
            }
            
            decimal totalProfit = totalSales - totalCostOfGoods;

            decimal totalExpenses = await _context.Expenses
                .Where(e => e.Date >= today && e.Date < tomorrow)
                .SumAsync(e => e.Amount, token);

            // --- CHART 1: PAYMENT METHOD STATS ---
            var paymentStats = await _context.Invoices
                .Where(i => i.Date >= sevenDaysAgo)
                .GroupBy(i => i.PaymentMethod)
                .Select(g => new PaymentStatDto 
                { 
                    Name = g.Key, 
                    Value = g.Sum(x => x.TotalAmount) 
                })
                .ToListAsync(token);

            // --- CHART 2: TOP 5 PRODUCTS ---
            var topProductsList = await _context.InvoiceItems
                .Where(x => x.Invoice.Date >= sevenDaysAgo)
                .GroupBy(x => x.ProductName)
                .Select(g => new TopProductDto 
                { 
                    Name = g.Key, 
                    Quantity = g.Sum(x => x.Quantity),
                    Revenue = g.Sum(x => x.Quantity * x.UnitPrice)
                })
                .OrderByDescending(x => x.Quantity)
                .Take(5)
                .ToListAsync(token);

            // --- CHART 3: WEEKLY TREND ---
            var trend = new List<DailySalesDto>();
            for (int i = 0; i < 7; i++)
            {
                var currentDay = sevenDaysAgo.AddDays(i);
                var dayInvoices = weeklyInvoices.Where(x => x.Date.Date == currentDay).ToList();
                
                decimal daySales = dayInvoices.Sum(x => x.TotalAmount);
                decimal dayCost = 0;

                foreach(var inv in dayInvoices)
                {
                    foreach(var item in inv.Items)
                    {
                        if(item.Product != null)
                        {
                            decimal safeCost = item.Product.CostPrice > item.Product.SalePrice ? 0 : item.Product.CostPrice;
                            dayCost += (safeCost * item.Quantity);
                        }
                    }
                }

                trend.Add(new DailySalesDto
                {
                    DateLabel = currentDay.ToString("ddd"),
                    Total = daySales,
                    Profit = daySales - dayCost
                });
            }

            // --- LISTS ---
            var lowStockItems = await _context.Products
                .Where(p => p.StockQuantity <= p.LowStockAlert)
                .OrderBy(p => p.StockQuantity)
                .Take(5)
                .Select(p => new LowStockItemDto
                {
                    Name = p.Name,
                    Stock = p.StockQuantity
                })
                .ToListAsync(token);

            var recentSales = await _context.Invoices
                .Include(i => i.Customer)
                .OrderByDescending(i => i.Date)
                .Take(5)
                .Select(i => new RecentSaleDto
                {
                    Id = i.Id.ToString(),
                    Time = i.Date.ToString("o"), 
                    Customer = i.Customer != null ? i.Customer.Name : "Walking Customer",
                    Amount = i.TotalAmount,
                    Status = i.PaymentMethod == "Credit" ? "Credit" : "Paid"
                })
                .ToListAsync(token);

            return new DashboardStatsDto
            {
                TotalSalesToday = totalSales,
                TotalExpensesToday = totalExpenses,
                TotalProfitToday = totalProfit,
                LowStockItemCount = lowStockItems.Count,
                TopSellingProduct = topProductsList.FirstOrDefault()?.Name ?? "N/A",
                
                SalesTrend = trend,
                PaymentStats = paymentStats,
                TopProducts = topProductsList,
                RecentSales = recentSales,
                LowStockItems = lowStockItems
            };
        }
    }
}