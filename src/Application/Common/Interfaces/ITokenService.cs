namespace Application.Common.Interfaces
{
    public interface ITokenService
    {
        // We pass User ID, Username, Roles, and Shop ID (Tenant) to the token
        string GenerateToken(string userId, string username, IList<string> roles, string? tenantId);
    }
}