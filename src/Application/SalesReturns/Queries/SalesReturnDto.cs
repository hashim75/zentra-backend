namespace Application.SalesReturns.Queries
{
    public class SalesReturnDto
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }
        public string Reason { get; set; } = string.Empty;
        public decimal RefundAmount { get; set; }
        public int ItemCount { get; set; }
    }
}