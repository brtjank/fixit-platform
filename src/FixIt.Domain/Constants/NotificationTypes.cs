namespace FixIt.Domain.Constants;

/// <summary>
/// Stable notification type identifiers. Clients render the text from the type, so values must
/// never change once released.
/// </summary>
public static class NotificationTypes
{
    public const string ServiceRequestStatusChanged = "ServiceRequestStatusChanged";
}
