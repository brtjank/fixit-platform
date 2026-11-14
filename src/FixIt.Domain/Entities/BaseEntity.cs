using System.Text.Json.Serialization;
using FixIt.Domain.Events;

namespace FixIt.Domain.Entities;

public abstract class BaseEntity
{
    private readonly List<IDomainEvent> _domainEvents = [];

    public Guid Id { get; protected set; } = Guid.NewGuid();
    public Guid TenantId { get; protected set; }
    public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;
    public bool IsDeleted { get; protected set; }

    // Collected by the DbContext into the outbox on save; never persisted or serialised directly
    [JsonIgnore]
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected BaseEntity() { }

    protected BaseEntity(Guid tenantId)
    {
        TenantId = tenantId;
    }

    public void SoftDelete()
    {
        IsDeleted = true;
    }

    public void ClearDomainEvents() => _domainEvents.Clear();

    protected void Raise(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
}
