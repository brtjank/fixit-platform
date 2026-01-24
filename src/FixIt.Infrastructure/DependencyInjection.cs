using Microsoft.Extensions.DependencyInjection;

namespace FixIt.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        // Infrastructure services will be registered here in Phase 2 (EF Core, repositories, etc.)

        return services;
    }
}
