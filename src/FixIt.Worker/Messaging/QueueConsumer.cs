using System.Text.Json;
using Azure.Storage.Queues.Models;
using FixIt.Infrastructure.Messaging;
using MediatR;

namespace FixIt.Worker.Messaging;

/// <summary>
/// Pulls messages from the service-request queue and dispatches each through MediatR in its own DI
/// scope. A message is deleted only after it was handled; failures become visible again after the
/// visibility timeout and move to the poison queue once retried too often.
/// </summary>
public class QueueConsumer : BackgroundService
{
    private const int BatchSize = 16;
    private const int MaxDequeueCount = 5;
    private static readonly TimeSpan VisibilityTimeout = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan MinIdleDelay = TimeSpan.FromSeconds(1);
    private static readonly TimeSpan MaxIdleDelay = TimeSpan.FromSeconds(10);

    private readonly QueueClientProvider _queues;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<QueueConsumer> _logger;

    public QueueConsumer(
        QueueClientProvider queues,
        IServiceScopeFactory scopeFactory,
        ILogger<QueueConsumer> logger
    )
    {
        _queues = queues;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Queue consumer started (queue {QueueName})", _queues.Queue.Name);

        var queuesReady = false;
        var idleDelay = MinIdleDelay;
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (!queuesReady)
                {
                    await _queues.EnsureQueuesExistAsync(stoppingToken);
                    queuesReady = true;
                }

                QueueMessage[] messages = await _queues.Queue.ReceiveMessagesAsync(
                    BatchSize,
                    VisibilityTimeout,
                    stoppingToken
                );

                if (messages.Length == 0)
                {
                    await Task.Delay(idleDelay, stoppingToken);
                    idleDelay = TimeSpan.FromTicks(Math.Min(idleDelay.Ticks * 2, MaxIdleDelay.Ticks));
                    continue;
                }

                idleDelay = MinIdleDelay;
                foreach (var message in messages)
                    await ProcessAsync(message, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Receiving from queue {QueueName} failed", _queues.Queue.Name);
                await DelayQuietlyAsync(MaxIdleDelay, stoppingToken);
            }
        }
    }

    private async Task ProcessAsync(QueueMessage message, CancellationToken cancellationToken)
    {
        if (message.DequeueCount > MaxDequeueCount)
        {
            await MoveToPoisonAsync(message, $"dequeued {message.DequeueCount} times", cancellationToken);
            return;
        }

        Func<ISender, CancellationToken, Task>? dispatch;
        string? type;
        try
        {
            dispatch = MessageDispatcher.Resolve(message.MessageText, out type);
        }
        catch (JsonException ex)
        {
            await MoveToPoisonAsync(message, $"malformed message: {ex.Message}", cancellationToken);
            return;
        }

        if (dispatch is null)
        {
            await MoveToPoisonAsync(message, $"unknown message type '{type}'", cancellationToken);
            return;
        }

        try
        {
            using var scope = _scopeFactory.CreateScope();
            await dispatch(scope.ServiceProvider.GetRequiredService<ISender>(), cancellationToken);
            await _queues.Queue.DeleteMessageAsync(message.MessageId, message.PopReceipt, cancellationToken);

            _logger.LogInformation(
                "Handled message {MessageId} ({MessageType}), attempt {DequeueCount}",
                message.MessageId,
                type,
                message.DequeueCount
            );
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Left in the queue: it reappears after the visibility timeout and is retried
            _logger.LogWarning(
                ex,
                "Handling message {MessageId} ({MessageType}) failed, attempt {DequeueCount} of {MaxDequeueCount}",
                message.MessageId,
                type,
                message.DequeueCount,
                MaxDequeueCount
            );
        }
    }

    private async Task MoveToPoisonAsync(
        QueueMessage message,
        string reason,
        CancellationToken cancellationToken
    )
    {
        await _queues.PoisonQueue.SendMessageAsync(message.MessageText, cancellationToken);
        await _queues.Queue.DeleteMessageAsync(message.MessageId, message.PopReceipt, cancellationToken);

        _logger.LogError(
            "Moved message {MessageId} to {PoisonQueueName}: {Reason}",
            message.MessageId,
            _queues.PoisonQueue.Name,
            reason
        );
    }

    private static async Task DelayQuietlyAsync(TimeSpan delay, CancellationToken cancellationToken)
    {
        try
        {
            await Task.Delay(delay, cancellationToken);
        }
        catch (OperationCanceledException) { }
    }
}
