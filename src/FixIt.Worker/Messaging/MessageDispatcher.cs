using System.Text.Json;
using FixIt.Application.Features.Notifications.HandleServiceRequestStatusChanged;
using FixIt.Domain.Events;
using FixIt.Infrastructure.Messaging;
using MediatR;

namespace FixIt.Worker.Messaging;

/// <summary>
/// Maps a queue message type to the MediatR command that handles it.
/// </summary>
public static class MessageDispatcher
{
    private static readonly Dictionary<string, Func<JsonElement, Func<ISender, CancellationToken, Task>>> Handlers =
        new()
        {
            [nameof(ServiceRequestStatusChanged)] = payload =>
            {
                var @event =
                    payload.Deserialize<ServiceRequestStatusChanged>(MessageEnvelope.SerializerOptions)
                    ?? throw new JsonException("Payload is empty.");
                return (sender, ct) =>
                    sender.Send(new HandleServiceRequestStatusChangedCommand(@event), ct);
            },
        };

    /// <summary>
    /// Parses the envelope and returns the dispatch call. Returns null for unknown types;
    /// throws <see cref="JsonException"/> for malformed messages (both are poison).
    /// </summary>
    public static Func<ISender, CancellationToken, Task>? Resolve(string messageText, out string? type)
    {
        var envelope =
            JsonSerializer.Deserialize<MessageEnvelope>(messageText, MessageEnvelope.SerializerOptions)
            ?? throw new JsonException("Message is empty.");
        type = envelope.Type;

        return envelope.Type is not null && Handlers.TryGetValue(envelope.Type, out var factory)
            ? factory(envelope.Payload)
            : null;
    }
}
