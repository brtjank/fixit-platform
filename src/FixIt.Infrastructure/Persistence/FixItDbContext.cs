using FixIt.Domain.Entities;
using Microsoft.EntityFrameworkCore;

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
    }
}
