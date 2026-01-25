using FixIt.Application.Interfaces;
using FixIt.Application.Services;
using FixIt.Infrastructure.Persistence;
using FixIt.Infrastructure.Repositories;
using FixIt.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FixIt.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        // Add DbContext
        services.AddDbContext<FixItDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                npgsqlOptions =>
                    npgsqlOptions.MigrationsAssembly(typeof(FixItDbContext).Assembly.FullName)
            )
        );

        // Register repositories
        services.AddScoped<IServiceRequestRepository, ServiceRequestRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IServiceLogRepository, ServiceLogRepository>();

        // Register services
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        return services;
    }
}
