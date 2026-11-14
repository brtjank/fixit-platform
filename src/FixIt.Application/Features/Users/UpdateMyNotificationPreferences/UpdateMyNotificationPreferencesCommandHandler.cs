using FixIt.Application.Features.Users.GetMyNotificationPreferences;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using MediatR;

namespace FixIt.Application.Features.Users.UpdateMyNotificationPreferences;

public class UpdateMyNotificationPreferencesCommandHandler
    : IRequestHandler<UpdateMyNotificationPreferencesCommand, NotificationPreferencesResponse>
{
    private readonly IUserNotificationPreferencesRepository _preferencesRepository;
    private readonly ICurrentUserService _currentUser;

    public UpdateMyNotificationPreferencesCommandHandler(
        IUserNotificationPreferencesRepository preferencesRepository,
        ICurrentUserService currentUser
    )
    {
        _preferencesRepository = preferencesRepository;
        _currentUser = currentUser;
    }

    public async Task<NotificationPreferencesResponse> Handle(
        UpdateMyNotificationPreferencesCommand request,
        CancellationToken cancellationToken
    )
    {
        var tenantId = _currentUser.TenantId;
        var userId = _currentUser.UserId;

        var preferences = await _preferencesRepository.GetByUserIdAsync(
            userId,
            tenantId,
            cancellationToken
        );

        // Upsert: users start without a row (defaults), so the first save creates it
        if (preferences is null)
        {
            preferences = new UserNotificationPreferences(tenantId, userId);
            Apply(preferences, request);
            await _preferencesRepository.AddAsync(preferences, cancellationToken);
        }
        else
        {
            Apply(preferences, request);
            await _preferencesRepository.UpdateAsync(preferences, cancellationToken);
        }

        return NotificationPreferencesResponse.From(preferences);
    }

    private static void Apply(
        UserNotificationPreferences preferences,
        UpdateMyNotificationPreferencesCommand request
    ) =>
        preferences.Update(
            request.EmailOnNewRequest,
            request.EmailOnAssignment,
            request.EmailOnStatusChange,
            request.DailyDigest
        );
}
