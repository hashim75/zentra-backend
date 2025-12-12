using System;
using System.Collections.Generic;
using Domain.Common;

namespace Domain.Entities
{
    public class SalesReturn : BaseEntity
    {
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public string Reason { get; set; } = string.Empty;
        public decimal RefundAmount { get; set; }
        public Guid? OriginalInvoiceId { get; set; }
        
        public ICollection<SalesReturnItem> Items { get; set; } = new List<SalesReturnItem>();
    }
}
// IF YOU SEE "public class SalesReturnItem" BELOW THIS LINE, DELETE IT!