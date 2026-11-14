namespace FixIt.Domain.Events;

/// <summary>
/// Something that happened in the domain and that other parts of the system may react to.
/// Raised by entities, persisted to the outbox in the same transaction and published asynchronously.
/// </summary>
public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
}
