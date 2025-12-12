using System;
using System.Collections.Generic;
using Domain.Common; // <--- ADD THIS LINE !!
namespace Domain.Entities
{
    public class Customer : BaseEntity
    {
       
        public string Name { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty; // Crucial for WhatsApp
        
        // --- Advanced Features ---
        public decimal CreditBalance { get; set; } = 0; // Positive = They owe us (Udhaar)
        public decimal CreditLimit { get; set; } = 50000; // Stop sale if they owe too much
        public bool IsBadDebtor { get; set; } = false; // AI marks this true if they don't pay in 60 days
        
        public DateTime? LastPaymentDate { get; set; }
        public int LoyaltyPoints { get; set; } = 0;

        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
}