namespace FixIt.Application.Features.Notifications.HandleServiceRequestStatusChanged;

/// <param name="NotificationsCreated">Rows inserted by this delivery (0 when it was a redelivery).</param>
public record HandleServiceRequestStatusChangedResponse(int NotificationsCreated);
