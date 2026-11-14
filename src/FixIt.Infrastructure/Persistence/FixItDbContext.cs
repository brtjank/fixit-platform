using System.Text.Json;
using FixIt.Application.Common.Exceptions;
using FixIt.Domain.Entities;
using FixIt.Infrastructure.Messaging;
using FixIt.Infrastructure.Persistence.Outbox;
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
    public DbSet<Notification> Notifications { get; set; } = null!;
    public DbSet<OutboxMessage> OutboxMessages { get; set; } = null!;

    // Domain events raised by tracked entities are written to the outbox by the same SaveChanges
    // (one transaction) as the state change that raised them.
    // Unique violations are translated here so every repository surfaces them the same way and
    // Application handlers can map known constraints without referencing Npgsql.
    public override async Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default
    )
    {
        var (raisedBy, outboxMessages) = AddOutboxMessages();
        try
        {
            var result = await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
            raisedBy.ForEach(entity => entity.ClearDomainEvents());
            return result;
        }
        catch (Exception ex)
        {
            // Events stay on the entities, so a retried save re-creates exactly these rows
            outboxMessages.ForEach(message => Entry(message).State = EntityState.Detached);

            if (
                ex is DbUpdateException
                {
                    InnerException: PostgresException
                    {
                        SqlState: PostgresErrorCodes.UniqueViolation,
                        ConstraintName: { } constraintName
                    }
                }
            )
                throw new UniqueConstraintViolationException(constraintName, ex);

            throw;
        }
    }

    private (List<BaseEntity> RaisedBy, List<OutboxMessage> Messages) AddOutboxMessages()
    {
        var raisedBy = ChangeTracker
            .Entries<BaseEntity>()
            .Where(e => e.State != EntityState.Detached && e.Entity.DomainEvents.Count > 0)
            .Select(e => e.Entity)
            .ToList();

        var messages = raisedBy
            .SelectMany(entity => entity.DomainEvents)
            .Select(domainEvent => new OutboxMessage(
                domainEvent.EventId,
                domainEvent.GetType().Name,
                JsonSerializer.Serialize(
                    domainEvent,
                    domainEvent.GetType(),
                    MessageEnvelope.SerializerOptions
                ),
                domainEvent.OccurredAt
            ))
            .ToList();

        OutboxMessages.AddRange(messages);
        return (raisedBy, messages);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity configurations
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(FixItDbContext).Assembly);

        // Domain events live only in memory until they are copied to the outbox
        foreach (
            var entityType in modelBuilder
                .Model.GetEntityTypes()
                .Where(t => typeof(BaseEntity).IsAssignableFrom(t.ClrType))
        )
        {
            modelBuilder.Entity(entityType.ClrType).Ignore(nameof(BaseEntity.DomainEvents));
        }

        // Global Query Filters for soft delete
        modelBuilder.Entity<Tenant>().HasQueryFilter(t => !t.IsDeleted);
        modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
        modelBuilder.Entity<WorkerProfile>().HasQueryFilter(wp => !wp.IsDeleted);
        modelBuilder.Entity<ServiceRequest>().HasQueryFilter(sr => !sr.IsDeleted);
        modelBuilder.Entity<ServiceLog>().HasQueryFilter(sl => !sl.IsDeleted);
        modelBuilder.Entity<UserNotificationPreferences>().HasQueryFilter(np => !np.IsDeleted);
        modelBuilder.Entity<Notification>().HasQueryFilter(n => !n.IsDeleted);
    }
}
