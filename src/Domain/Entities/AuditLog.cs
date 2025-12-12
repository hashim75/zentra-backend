using System;
using Domain.Common; // <--- ADD THIS LINE !!
namespace Domain.Entities
{
    public class AuditLog : BaseEntity
    {
        
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        public string Action { get; set; } = string.Empty; // e.g., "Deleted Invoice", "Opened Cash Drawer"
        public string Details { get; set; } = string.Empty; // e.g., "User deleted Invoice #1005 worth 5000 Rs"
        public string Username { get; set; } = string.Empty; // Who did it?
        
        public bool IsSuspicious { get; set; } = false; // Highlights red in dashboard
    }
}