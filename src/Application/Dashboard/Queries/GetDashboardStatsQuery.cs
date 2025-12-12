using MediatR;

namespace Application.Dashboard.Queries
{
    // 1. The Request
    public record GetDashboardStatsQuery : IRequest<DashboardStatsDto>;

    // 2. The Response Data Structure (DTOs)
    public class DashboardStatsDto
    {
        public decimal TotalSalesToday { get; set; }
        public decimal TotalProfitToday { get; set; }
        public decimal TotalExpensesToday { get; set; }
        public int LowStockItemCount { get; set; }
        public string TopSellingProduct { get; set; } = string.Empty;
        
        public List<DailySalesDto> SalesTrend { get; set; } = new();
        public List<RecentSaleDto> RecentSales { get; set; } = new();
        public List<LowStockItemDto> LowStockItems { get; set; } = new();
        
        // New Charts
        public List<PaymentStatDto> PaymentStats { get; set; } = new();
        public List<TopProductDto> TopProducts { get; set; } = new();
    }

    public class PaymentStatDto 
    { 
        public string Name { get; set; } = string.Empty;
        public decimal Value { get; set; } 
    }

    public class TopProductDto 
    { 
        public string Name { get; set; } = string.Empty;
        public int Quantity { get; set; } 
        public decimal Revenue { get; set; } 
    }
    
    public class DailySalesDto 
    { 
        public string DateLabel { get; set; } = string.Empty;
        public decimal Total { get; set; } 
        public decimal Profit { get; set; } 
    }

    public class RecentSaleDto 
    { 
        public string Id { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public string Customer { get; set; } = string.Empty;
        public decimal Amount { get; set; } 
        public string Status { get; set; } = string.Empty;
    }

    public class LowStockItemDto 
    { 
        public string Name { get; set; } = string.Empty;
        public int Stock { get; set; } 
    }
}