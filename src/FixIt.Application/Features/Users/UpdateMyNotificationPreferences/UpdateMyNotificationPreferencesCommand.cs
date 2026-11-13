using FixIt.Application.Features.Users.GetMyNotificationPreferences;
using MediatR;

namespace FixIt.Application.Features.Users.UpdateMyNotificationPreferences;

public record UpdateMyNotificationPreferencesCommand(
    bool EmailOnNewRequest,
    bool EmailOnAssignment,
    bool EmailOnStatusChange,
    bool DailyDigest
) : IRequest<NotificationPreferencesResponse>;
