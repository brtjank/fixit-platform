using FixIt.Application.Interfaces.Services;

namespace FixIt.Infrastructure.Messaging;

public class AzureQueueMessagePublisher : IMessagePublisher
{
    private readonly QueueClientProvider _queues;

    public AzureQueueMessagePublisher(QueueClientProvider queues)
    {
        _queues = queues;
    }

    public async Task PublishAsync(
        string type,
        string payload,
        CancellationToken cancellationToken = default
    )
    {
        await _queues.Queue.SendMessageAsync(
            MessageEnvelope.Wrap(type, payload),
            cancellationToken
        );
    }
}
