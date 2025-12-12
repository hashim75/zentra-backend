using System;
using Domain.Common;

namespace Domain.Entities
{
    public class SalesReturnItem : BaseEntity
    {
        public Guid SalesReturnId { get; set; }
        
        public Guid ProductId { get; set; }
        public Product? Product { get; set; }
        
        public int Quantity { get; set; }
        public decimal RefundAmount { get; set; }
    }
}