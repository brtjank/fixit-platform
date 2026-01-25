using FixIt.Application.Interfaces;
using FixIt.Domain.Entities;
using FixIt.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FixIt.Infrastructure.Repositories;

public class ServiceLogRepository : IServiceLogRepository
{
    private readonly FixItDbContext _context;

    public ServiceLogRepository(FixItDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ServiceLog>> GetByServiceRequestIdAsync(
        Guid serviceRequestId,
        Guid tenantId,
        CancellationToken cancellationToken = default
    )
    {
        return await _context
            .ServiceLogs.Where(sl =>
                sl.ServiceRequestId == serviceRequestId && sl.TenantId == tenantId
            )
            .OrderByDescending(sl => sl.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<ServiceLog> AddAsync(
        ServiceLog serviceLog,
        CancellationToken cancellationToken = default
    )
    {
        await _context.ServiceLogs.AddAsync(serviceLog, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return serviceLog;
    }
}
