using MediatR;

namespace Application.Customers.Commands.UpdateCustomer
{
    public record UpdateCustomerCommand : IRequest
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = string.Empty;
        public string PhoneNumber { get; init; } = string.Empty;
        
        // --- ADD THIS LINE ---
        public decimal CreditBalance { get; init; } 
    }
}