using System;
using System.Collections.Generic;
using Domain.Common; // <--- ADD THIS LINE !!
namespace Domain.Entities
{
    public class Category : BaseEntity
    {
        
        public string Name { get; set; } = string.Empty; // e.g., "Antibiotics"
        public string Description { get; set; } = string.Empty;
        
        // Navigation Property (One Category -> Many Products)
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}