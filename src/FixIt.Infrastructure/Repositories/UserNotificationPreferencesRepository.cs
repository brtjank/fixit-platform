using FixIt.Application.Interfaces.Repositories;
using FixIt.Domain.Entities;
using FixIt.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FixIt.Infrastructure.Repositories;

public class UserNotificationPreferencesRepository : IUserNotificationPreferencesRepository
{
    private readonly FixItDbContext _context;

    public UserNotificationPreferencesRepository(FixItDbContext context)
    {
        _context = context;
    }

    public async Task<UserNotificationPreferences?> GetByUserIdAsync(
        Guid userId,
        Guid tenantId,
        CancellationToken cancellationToken = default
    )
    {
        return await _context.UserNotificationPreferences.FirstOrDefaultAsync(
            np => np.UserId == userId && np.TenantId == tenantId,
            cancellationToken
        );
    }

    public async Task<UserNotificationPreferences> AddAsync(
        UserNotificationPreferences preferences,
        CancellationToken cancellationToken = default
    )
    {
        await _context.UserNotificationPreferences.AddAsync(preferences, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return preferences;
    }

    public async Task UpdateAsync(
        UserNotificationPreferences preferences,
        CancellationToken cancellationToken = default
    )
    {
        _context.UserNotificationPreferences.Update(preferences);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
