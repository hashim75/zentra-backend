using System;
using Domain.Common;

namespace Domain.Entities
{
    public class Expense : BaseEntity
    {
        public string Description { get; set; } = string.Empty; // e.g., "Electricity Bill Jan"
        public decimal Amount { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public string Category { get; set; } = "General"; // e.g., "Utilities", "Rent", "Salary"
    }
}