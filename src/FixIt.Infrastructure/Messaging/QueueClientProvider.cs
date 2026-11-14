using Azure.Storage.Queues;
using Microsoft.Extensions.Options;

namespace FixIt.Infrastructure.Messaging;

/// <summary>
/// Singleton holder of the queue clients (they are thread-safe and meant to be reused).
/// </summary>
public class QueueClientProvider
{
    public QueueClient Queue { get; }
    public QueueClient PoisonQueue { get; }

    public QueueClientProvider(IOptions<MessagingOptions> options)
    {
        var settings = options.Value;
        // Base64 matches the Azure Functions / portal default, so messages stay readable by other tools
        var clientOptions = new QueueClientOptions { MessageEncoding = QueueMessageEncoding.Base64 };
        // Fail fast: the outbox and the consumer loop already retry, and the outbox publisher holds
        // row locks while sending (the SDK default of 6 retries kept them for ~40 s during an outage)
        clientOptions.Retry.MaxRetries = 2;
        clientOptions.Retry.NetworkTimeout = TimeSpan.FromSeconds(10);

        Queue = new QueueClient(settings.QueueConnectionString, settings.QueueName, clientOptions);
        PoisonQueue = new QueueClient(
            settings.QueueConnectionString,
            settings.PoisonQueueName,
            clientOptions
        );
    }

    public async Task EnsureQueuesExistAsync(CancellationToken cancellationToken = default)
    {
        await Queue.CreateIfNotExistsAsync(cancellationToken: cancellationToken);
        await PoisonQueue.CreateIfNotExistsAsync(cancellationToken: cancellationToken);
    }
}
