using MediatR;

namespace FixIt.Application.Features.Users.GetMyNotificationPreferences;

public record GetMyNotificationPreferencesQuery : IRequest<NotificationPreferencesResponse>;
