using System.Text.Json;
using System.Text.Json.Serialization;

namespace FixIt.Infrastructure.Messaging;

/// <summary>
/// Wire format of every queue message: <c>{ "type": "...", "payload": { ... } }</c>.
/// </summary>
public record MessageEnvelope(
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("payload")] JsonElement Payload
)
{
    // Shared by the publisher (API) and consumer (Worker) so both sides agree on the format
    public static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public static string Wrap(string type, string payloadJson)
    {
        using var payload = JsonDocument.Parse(payloadJson);
        return JsonSerializer.Serialize(
            new MessageEnvelope(type, payload.RootElement),
            SerializerOptions
        );
    }
}
