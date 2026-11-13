using FixIt.Domain.Entities;

namespace FixIt.Application.Features.Users.GetMyNotificationPreferences;

/// <summary>
/// Only the four flags are exposed: the row's ids and audit fields mean nothing to clients,
/// especially when no row exists yet and defaults are returned.
/// </summary>
public record NotificationPreferencesResponse(
    bool EmailOnNewRequest,
    bool EmailOnAssignment,
    bool EmailOnStatusChange,
    bool DailyDigest
)
{
    public static NotificationPreferencesResponse From(UserNotificationPreferences preferences) =>
        new(
            preferences.EmailOnNewRequest,
            preferences.EmailOnAssignment,
            preferences.EmailOnStatusChange,
            preferences.DailyDigest
        );
}
