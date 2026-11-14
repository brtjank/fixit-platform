using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Infrastructure.Messaging;
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
        services.AddScoped<ITenantRepository, TenantRepository>();
        services.AddScoped<IWorkerProfileRepository, WorkerProfileRepository>();
        services.AddScoped<
            IUserNotificationPreferencesRepository,
            UserNotificationPreferencesRepository
        >();
        services.AddScoped<INotificationRepository, NotificationRepository>();

        // Messaging (queue clients are thread-safe and reused for the app lifetime)
        services.Configure<MessagingOptions>(
            configuration.GetSection(MessagingOptions.SectionName)
        );
        services.AddSingleton<QueueClientProvider>();
        services.AddSingleton<IMessagePublisher, AzureQueueMessagePublisher>();

        // Register services
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IQueryableExecutor, QueryableExecutor>();
        services.AddSingleton<IPasswordHasher, PasswordHasherService>();
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();

        return services;
    }

    /// <summary>
    /// Relays the transactional outbox to the queue. Hosted by the API, which writes the outbox.
    /// </summary>
    public static IServiceCollection AddOutboxPublisher(this IServiceCollection services)
    {
        services.AddHostedService<OutboxPublisher>();
        return services;
    }
}
