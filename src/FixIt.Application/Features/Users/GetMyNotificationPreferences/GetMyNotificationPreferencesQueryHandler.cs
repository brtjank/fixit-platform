using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using MediatR;

namespace FixIt.Application.Features.Users.GetMyNotificationPreferences;

public class GetMyNotificationPreferencesQueryHandler
    : IRequestHandler<GetMyNotificationPreferencesQuery, NotificationPreferencesResponse>
{
    private readonly IUserNotificationPreferencesRepository _preferencesRepository;
    private readonly ICurrentUserService _currentUser;

    public GetMyNotificationPreferencesQueryHandler(
        IUserNotificationPreferencesRepository preferencesRepository,
        ICurrentUserService currentUser
    )
    {
        _preferencesRepository = preferencesRepository;
        _currentUser = currentUser;
    }

    public async Task<NotificationPreferencesResponse> Handle(
        GetMyNotificationPreferencesQuery request,
        CancellationToken cancellationToken
    )
    {
        // Rows are created lazily on the first save; until then the entity's defaults apply.
        // The unsaved instance is only used to read those defaults from a single place.
        var preferences =
            await _preferencesRepository.GetByUserIdAsync(
                _currentUser.UserId,
                _currentUser.TenantId,
                cancellationToken
            ) ?? new UserNotificationPreferences(_currentUser.TenantId, _currentUser.UserId);

        return NotificationPreferencesResponse.From(preferences);
    }
}
