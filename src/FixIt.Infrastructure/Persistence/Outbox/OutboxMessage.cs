namespace FixIt.Infrastructure.Persistence.Outbox;

/// <summary>
/// Domain event waiting to be published. Written in the same transaction as the change that raised
/// it, so an event is never lost or published for a change that was rolled back.
/// </summary>
public class OutboxMessage
{
    public Guid Id { get; private set; }
    public string Type { get; private set; } = string.Empty;
    public string Payload { get; private set; } = string.Empty;
    public DateTime OccurredAt { get; private set; }
    public DateTime? ProcessedAt { get; private set; }
    public int Attempts { get; private set; }
    public string? LastError { get; private set; }

    private OutboxMessage() { }

    public OutboxMessage(Guid id, string type, string payload, DateTime occurredAt)
    {
        Id = id;
        Type = type;
        Payload = payload;
        OccurredAt = occurredAt;
    }

    public void MarkProcessed(DateTime processedAtUtc)
    {
        ProcessedAt = processedAtUtc;
        Attempts++;
        LastError = null;
    }

    public void MarkFailed(string error)
    {
        Attempts++;
        LastError = error.Length > MaxErrorLength ? error[..MaxErrorLength] : error;
    }

    // The queue rejected the message itself (e.g. too large): retrying can never succeed and would
    // block every newer message, so it is closed with the error kept for inspection
    public void MarkAbandoned(DateTime abandonedAtUtc, string error)
    {
        MarkFailed($"Abandoned: {error}");
        ProcessedAt = abandonedAtUtc;
    }

    public const int MaxErrorLength = 2000;
}
