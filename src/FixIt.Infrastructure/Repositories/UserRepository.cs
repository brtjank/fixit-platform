using FixIt.Application.Features.Auth.SessionValidation;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Domain.Entities;
using FixIt.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FixIt.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly FixItDbContext _context;

    public UserRepository(FixItDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(
        Guid id,
        Guid tenantId,
        CancellationToken cancellationToken = default
    )
    {
        return await _context.Users.FirstOrDefaultAsync(
            u => u.Id == id && u.TenantId == tenantId,
            cancellationToken
        );
    }

    public async Task<User?> GetByEmailAsync(
        string email,
        CancellationToken cancellationToken = default
    )
    {
        // Used for login: emails are unique across all tenants (enforced on creation) and compared
        // case-insensitively, matching how EmailExistsAsync guards uniqueness
        var normalized = NormalizeEmail(email);
        return await _context.Users.FirstOrDefaultAsync(
            u => u.Email.ToLower() == normalized,
            cancellationToken
        );
    }

    public async Task<bool> EmailExistsAsync(
        string email,
        CancellationToken cancellationToken = default
    )
    {
        // Soft-deleted rows are included: they still occupy the lower(Email) unique index,
        // and reusing a deleted account's email would make login ambiguous if it were ever restored
        var normalized = NormalizeEmail(email);
        return await _context
            .Users.IgnoreQueryFilters()
            .AnyAsync(u => u.Email.ToLower() == normalized, cancellationToken);
    }

    public async Task<UserSessionState?> GetSessionStateAsync(
        Guid id,
        CancellationToken cancellationToken = default
    )
    {
        // Runs on every authenticated request: untracked projection, and the soft-delete filter is
        // bypassed so a deleted account is reported as deleted rather than missing
        return await _context
            .Users.IgnoreQueryFilters()
            .AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new UserSessionState(
                u.Id,
                u.TenantId,
                u.IsActive,
                u.IsDeleted,
                u.TokenVersion
            ))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public IQueryable<User> GetByTenantId(Guid tenantId)
    {
        return _context.Users.Where(u => u.TenantId == tenantId);
    }

    public async Task<User> AddAsync(User user, CancellationToken cancellationToken = default)
    {
        await _context.Users.AddAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
