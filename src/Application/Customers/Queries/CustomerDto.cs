namespace Application.Customers.Queries
{
    public class CustomerDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public decimal CreditBalance { get; set; } // Udhaar
        public decimal CreditLimit { get; set; }
        public int LoyaltyPoints { get; set; }
    }
}