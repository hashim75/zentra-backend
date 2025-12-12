using System;
using System.Collections.Generic;
using Domain.Common;

namespace Domain.Entities
{
    public class Purchase : BaseEntity
    {
        public string InvoiceNumber { get; set; } = string.Empty; // Supplier's Invoice #
        public DateTime Date { get; set; } = DateTime.UtcNow;
        
        // Money
        public decimal TotalAmount { get; set; }
        public decimal AmountPaid { get; set; }
        public string PaymentMethod { get; set; } = "Cash"; // Cash, Bank, Credit(Udhaar)
        
        // Status
        public string Status { get; set; } = "Received"; // "Ordered", "Received"
        
        // Links
        public Guid SupplierId { get; set; }
        public Supplier? Supplier { get; set; }
        
        public ICollection<PurchaseItem> Items { get; set; } = new List<PurchaseItem>();
    }
}