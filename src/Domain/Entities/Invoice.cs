using System;
using System.Collections.Generic;
using Domain.Common;

namespace Domain.Entities
{
    public class Invoice : BaseEntity
    {
        public string InvoiceNumber { get; set; } = string.Empty; 
        public DateTime Date { get; set; } = DateTime.UtcNow;

        // Money
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal NetAmount { get; set; } 
        public decimal PaidAmount { get; set; }
        public decimal ChangeGiven { get; set; }

        public string PaymentMethod { get; set; } = "Cash"; 

        // --- NEW FIELD FOR RETURNS ---
        public string Status { get; set; } = "Completed"; // "Completed" or "Returned"
        // -----------------------------

        // Advanced Features
        public bool IsSyncedToCloud { get; set; } = false; 
        public string FbrInvoiceNumber { get; set; } = string.Empty; 
        public bool WhatsAppNotificationSent { get; set; } = false; 

        // Links
        public Guid? CustomerId { get; set; }
        public Customer? Customer { get; set; }
        
        public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    }
}