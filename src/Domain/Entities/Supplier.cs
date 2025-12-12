using System;
using System.Collections.Generic;
using Domain.Common;

namespace Domain.Entities
{
    public class Supplier : BaseEntity
    {
        public string Name { get; set; } = string.Empty; // e.g., "Nestle Distributor"
        public string ContactPerson { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        
        // The Money Logic
        public decimal Balance { get; set; } = 0; // Positive = We owe them money (Payable)
        
        public ICollection<Purchase> Purchases { get; set; } = new List<Purchase>();
    }
}