using FixIt.Application.Interfaces.Repositories;
using FixIt.Domain.Entities;
using FixIt.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FixIt.Infrastructure.Repositories;

public class WorkerProfileRepository : IWorkerProfileRepository
{
    private readonly FixItDbContext _context;

    public WorkerProfileRepository(FixItDbContext context)
    {
        _context = context;
    }

    public async Task<WorkerProfile?> GetByUserIdAsync(
        Guid userId,
        Guid tenantId,
        CancellationToken cancellationToken = default
    )
    {
        return await _context.WorkerProfiles.FirstOrDefaultAsync(
            wp => wp.UserId == userId && wp.TenantId == tenantId,
            cancellationToken
        );
    }

    public IQueryable<WorkerProfile> GetByTenantId(Guid tenantId)
    {
        return _context.WorkerProfiles.Where(wp => wp.TenantId == tenantId);
    }

    public async Task<WorkerProfile> AddAsync(
        WorkerProfile workerProfile,
        CancellationToken cancellationToken = default
    )
    {
        await _context.WorkerProfiles.AddAsync(workerProfile, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return workerProfile;
    }

    public async Task UpdateAsync(
        WorkerProfile workerProfile,
        CancellationToken cancellationToken = default
    )
    {
        _context.WorkerProfiles.Update(workerProfile);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
