using System.Text.Json.Serialization;

namespace FixIt.Application.Features.Users.UpdateMyNotificationPreferences;

// Full replacement: a missing flag would otherwise silently deserialise as false, so every
// flag is required and an incomplete body is rejected by model binding (400)
public record UpdateMyNotificationPreferencesRequest(
    [property: JsonRequired] bool EmailOnNewRequest,
    [property: JsonRequired] bool EmailOnAssignment,
    [property: JsonRequired] bool EmailOnStatusChange,
    [property: JsonRequired] bool DailyDigest
);
