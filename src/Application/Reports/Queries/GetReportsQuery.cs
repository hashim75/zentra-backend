using MediatR;

namespace Application.Reports.Queries
{
    public class GetReportsQuery : IRequest<ReportDto>
    {
        public DateTime From { get; set; }
        public DateTime To { get; set; }
    }

    public class ReportDto
    {
        // --- FINANCIALS ---
        public decimal TotalRevenue { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal NetCashFlow { get; set; }
        public decimal TotalProfit { get; set; }

        // --- SCALING METRICS (NEW) ---
        public decimal SalesGrowthPercentage { get; set; } // vs Previous Period
        public decimal AverageBasketValue { get; set; }    // Avg spend per visit
        public decimal CustomerRetentionRate { get; set; } // % of returning customers
        public int TotalTransactions { get; set; }

        // --- INVENTORY HEALTH ---
        public decimal InventoryCostValue { get; set; }
        public decimal ProjectedProfitValue { get; set; }

        // --- VISUALIZATIONS ---
        public List<HourlySalesDto> PeakHours { get; set; } = new();
        public List<ProductPerformanceDto> ProductPerformance { get; set; } = new();
        public List<CustomerInsightDto> TopCustomers { get; set; } = new();
    }

    public class HourlySalesDto 
    { 
        public string Hour { get; set; } = string.Empty; 
        public decimal Amount { get; set; } 
        public int Count { get; set; } 
    }

    public class ProductPerformanceDto 
    { 
        public string Name { get; set; } = string.Empty; 
        public int Sold { get; set; } 
        public decimal Revenue { get; set; }
        public decimal Margin { get; set; } 
        public string Category { get; set; } = "Standard"; 
    }

    public class CustomerInsightDto 
    { 
        public string Name { get; set; } = string.Empty; 
        public int Visits { get; set; } 
        public decimal Spent { get; set; } 
    }
}