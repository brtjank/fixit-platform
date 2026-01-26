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
        // Note: Used only for login - email should be unique across all tenants
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
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
}
