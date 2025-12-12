namespace Application.Common.Interfaces
{
    public interface IIdentityService
    {
        Task<string> GetUserNameAsync(string userId);
        
        // Register: Added role parameter (default is Admin)
        Task<(bool IsSuccess, string UserId)> CreateUserAsync(string userName, string password, string tenantId, string role = "Admin");
        
        Task<string?> AuthenticateAsync(string username, string password);
    }
}