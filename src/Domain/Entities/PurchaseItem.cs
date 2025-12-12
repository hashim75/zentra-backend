using System;
using Domain.Common;

namespace Domain.Entities
{
    public class PurchaseItem : BaseEntity
    {
        public Guid PurchaseId { get; set; }
        
        public Guid ProductId { get; set; }
        public Product? Product { get; set; }
        
        public int Quantity { get; set; }
        public decimal UnitCost { get; set; } // Updates the Product's CostPrice
        public decimal TotalCost => Quantity * UnitCost;
    }
}