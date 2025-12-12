using System;
using Domain.Common; // <--- ADD THIS LINE !!
namespace Domain.Entities
{
    public class InvoiceItem : BaseEntity
    {
        
        
        public Guid InvoiceId { get; set; }
        public Invoice? Invoice { get; set; }
        
        public Guid ProductId { get; set; }
        public Product? Product { get; set; }
        
        public string ProductName { get; set; } = string.Empty; // Snapshot name
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; } 
    }
}