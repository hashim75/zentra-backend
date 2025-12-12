using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using Application.Common.Mappings; // <--- Added this namespace

namespace Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));
            
            // --- THE FIX ---
            // Instead of guessing the assembly, we point exactly to the MappingProfile class
            services.AddAutoMapper(typeof(MappingProfile).Assembly);
            
            return services;
        }
    }
}