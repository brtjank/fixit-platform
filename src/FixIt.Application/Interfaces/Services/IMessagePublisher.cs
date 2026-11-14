namespace FixIt.Application.Interfaces.Services;

/// <summary>
/// Sends an integration message to the message broker. Delivery is at-least-once: consumers
/// must be idempotent.
/// </summary>
public interface IMessagePublisher
{
    Task PublishAsync(string type, string payload, CancellationToken cancellationToken = default);
}
