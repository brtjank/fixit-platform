using Azure;
using FixIt.Application.Interfaces.Services;
using FixIt.Infrastructure.Persistence;
using FixIt.Infrastructure.Persistence.Outbox;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FixIt.Infrastructure.Messaging;

/// <summary>
/// Relays pending outbox rows to the message queue. Rows are claimed with
/// <c>FOR UPDATE SKIP LOCKED</c>, so several API instances can run it without sending a row twice
/// concurrently. Delivery is still at-least-once (a crash between send and commit resends), which the
/// consumer tolerates by being idempotent.
/// </summary>
public class OutboxPublisher : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly QueueClientProvider _queues;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly MessagingOptions _options;
    private readonly ILogger<OutboxPublisher> _logger;

    public OutboxPublisher(
        IServiceScopeFactory scopeFactory,
        QueueClientProvider queues,
        IDateTimeProvider dateTimeProvider,
        IOptions<MessagingOptions> options,
        ILogger<OutboxPublisher> logger
    )
    {
        _scopeFactory = scopeFactory;
        _queues = queues;
        _dateTimeProvider = dateTimeProvider;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromSeconds(Math.Max(1, _options.OutboxPollIntervalSeconds));
        _logger.LogInformation(
            "Outbox publisher started (queue {QueueName}, every {Interval})",
            _options.QueueName,
            interval
        );

        var queuesReady = false;
        using var timer = new PeriodicTimer(interval);
        do
        {
            try
            {
                if (!queuesReady)
                {
                    await _queues.EnsureQueuesExistAsync(stoppingToken);
                    queuesReady = true;
                }

                // Keep draining while full batches come back, then wait for the next tick
                while (await PublishBatchAsync(stoppingToken) == _options.OutboxBatchSize) { }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Outbox publishing cycle failed; retrying on next tick");
            }
        } while (await WaitForNextTickAsync(timer, stoppingToken));
    }

    /// <returns>Number of rows claimed in this batch.</returns>
    private async Task<int> PublishBatchAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<FixItDbContext>();
        var publisher = scope.ServiceProvider.GetRequiredService<IMessagePublisher>();

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);

        var batch = await context
            .OutboxMessages.FromSqlInterpolated(
                $"""
                SELECT * FROM "OutboxMessages"
                WHERE "ProcessedAt" IS NULL
                ORDER BY "OccurredAt"
                LIMIT {_options.OutboxBatchSize}
                FOR UPDATE SKIP LOCKED
                """
            )
            .ToListAsync(cancellationToken);

        if (batch.Count == 0)
            return 0;

        var published = 0;
        foreach (var message in batch)
        {
            try
            {
                await publisher.PublishAsync(message.Type, message.Payload, cancellationToken);
                message.MarkProcessed(_dateTimeProvider.UtcNow);
                published++;
            }
            catch (RequestFailedException ex) when (IsPermanentRejection(ex))
            {
                message.MarkAbandoned(_dateTimeProvider.UtcNow, ex.Message);
                _logger.LogError(
                    ex,
                    "Outbox message {MessageId} ({MessageType}) rejected by the queue (HTTP {Status}); abandoned",
                    message.Id,
                    message.Type,
                    ex.Status
                );
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                message.MarkFailed(ex.Message);
                _logger.LogWarning(
                    ex,
                    "Failed to publish outbox message {MessageId} ({MessageType}), attempt {Attempts}",
                    message.Id,
                    message.Type,
                    message.Attempts
                );
                // The queue is most likely unavailable: stop here to keep ordering and retry later
                break;
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        if (published > 0)
            _logger.LogInformation("Published {Count} outbox messages", published);

        // A failed batch must not trigger an immediate re-drain
        return published == batch.Count ? batch.Count : 0;
    }

    // 4xx means the request itself is wrong (size, format); 408/429 are throttling/timeouts and stay retryable
    private static bool IsPermanentRejection(RequestFailedException ex) =>
        ex.Status is >= 400 and < 500 and not 408 and not 429;

    private static async Task<bool> WaitForNextTickAsync(
        PeriodicTimer timer,
        CancellationToken stoppingToken
    )
    {
        try
        {
            return await timer.WaitForNextTickAsync(stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return false;
        }
    }
}
