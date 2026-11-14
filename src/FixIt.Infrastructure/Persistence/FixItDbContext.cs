using FixIt.Application.Common.Exceptions;
using FixIt.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace FixIt.Infrastructure.Persistence;

public class FixItDbContext : DbContext
{
    public FixItDbContext(DbContextOptions<FixItDbContext> options)
        : base(options) { }

    public DbSet<Tenant> Tenants { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<WorkerProfile> WorkerProfiles { get; set; } = null!;
    public DbSet<ServiceRequest> ServiceRequests { get; set; } = null!;
    public DbSet<ServiceLog> ServiceLogs { get; set; } = null!;
    public DbSet<UserNotificationPreferences> UserNotificationPreferences { get; set; } = null!;

    // Unique violations are translated here so every repository surfaces them the same way and
    // Application handlers can map known constraints without referencing Npgsql
    public override async Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default
    )
    {
        try
        {
            return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is PostgresException
                {
                    SqlState: PostgresErrorCodes.UniqueViolation,
                    ConstraintName: { } constraintName
                }
            )
        {
            throw new UniqueConstraintViolationException(constraintName, ex);
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity configurations
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(FixItDbContext).Assembly);

        // Global Query Filters for soft delete
        modelBuilder.Entity<Tenant>().HasQueryFilter(t => !t.IsDeleted);
        modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
        modelBuilder.Entity<WorkerProfile>().HasQueryFilter(wp => !wp.IsDeleted);
        modelBuilder.Entity<ServiceRequest>().HasQueryFilter(sr => !sr.IsDeleted);
        modelBuilder.Entity<ServiceLog>().HasQueryFilter(sl => !sl.IsDeleted);
        modelBuilder.Entity<UserNotificationPreferences>().HasQueryFilter(np => !np.IsDeleted);
    }
}
