using FixIt.Application.Interfaces.Repositories;
using FixIt.Domain.Entities;
using FixIt.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FixIt.Infrastructure.Repositories;

public class ServiceRequestRepository : IServiceRequestRepository
{
    private readonly FixItDbContext _context;

    public ServiceRequestRepository(FixItDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceRequest?> GetByIdAsync(
        Guid id,
        Guid tenantId,
        CancellationToken cancellationToken = default
    )
    {
        return await _context.ServiceRequests.FirstOrDefaultAsync(
            sr => sr.Id == id && sr.TenantId == tenantId,
            cancellationToken
        );
    }

    public async Task<ServiceRequest?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default
    )
    {
        return await _context.ServiceRequests.FirstOrDefaultAsync(
            sr => sr.Id == id,
            cancellationToken
        );
    }

    public IQueryable<ServiceRequest> GetByTenantId(Guid tenantId)
    {
        return _context.ServiceRequests.Where(sr => sr.TenantId == tenantId);
    }

    public IQueryable<ServiceRequest> GetByCustomerId(Guid customerId, Guid tenantId)
    {
        return _context.ServiceRequests.Where(sr =>
            sr.CustomerId == customerId && sr.TenantId == tenantId
        );
    }

    public IQueryable<ServiceRequest> GetByWorkerId(Guid workerId, Guid tenantId)
    {
        return _context.ServiceRequests.Where(sr =>
            sr.AssignedWorkerId == workerId && sr.TenantId == tenantId
        );
    }

    public async Task<ServiceRequest> AddAsync(
        ServiceRequest serviceRequest,
        CancellationToken cancellationToken = default
    )
    {
        await _context.ServiceRequests.AddAsync(serviceRequest, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return serviceRequest;
    }

    public async Task UpdateAsync(
        ServiceRequest serviceRequest,
        CancellationToken cancellationToken = default
    )
    {
        _context.ServiceRequests.Update(serviceRequest);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
