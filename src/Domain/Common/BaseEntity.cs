namespace Domain.Common
{
    public abstract class BaseEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string TenantId { get; set; } = string.Empty; // Crucial for separation
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}