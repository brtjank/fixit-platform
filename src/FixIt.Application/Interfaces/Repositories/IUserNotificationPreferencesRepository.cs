using FixIt.Domain.Entities;

namespace FixIt.Application.Interfaces.Repositories;

public interface IUserNotificationPreferencesRepository
{
    Task<UserNotificationPreferences?> GetByUserIdAsync(
        Guid userId,
        Guid tenantId,
        CancellationToken cancellationToken = default
    );
    Task<UserNotificationPreferences> AddAsync(
        UserNotificationPreferences preferences,
        CancellationToken cancellationToken = default
    );
    Task UpdateAsync(
        UserNotificationPreferences preferences,
        CancellationToken cancellationToken = default
    );
}
