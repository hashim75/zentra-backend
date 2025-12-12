using System;
using Domain.Common; // <--- ADD THIS LINE !!
namespace Domain.Entities
{
    public class Product : BaseEntity
    {
       
        public string Name { get; set; } = string.Empty;
        public string Barcode { get; set; } = string.Empty; 
        public string SKU { get; set; } = string.Empty;
        
        public decimal SalePrice { get; set; } 
        public decimal CostPrice { get; set; } 
        
        public int StockQuantity { get; set; }
        public int LowStockAlert { get; set; } = 5; 
        
        // --- Advanced Features ---
        public bool IsExpireable { get; set; } = false; // Does this item expire?
        public DateTime? ExpiryDate { get; set; } // For "Expiry Protection" alerts
        
        // Link to Category
        public Guid CategoryId { get; set; }
        public Category? Category { get; set; }
    }
}