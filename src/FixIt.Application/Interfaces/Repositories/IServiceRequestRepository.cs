using FixIt.Domain.Entities;

namespace FixIt.Application.Interfaces.Repositories;

public interface IServiceRequestRepository
{
    Task<ServiceRequest?> GetByIdAsync(
        Guid id,
        Guid tenantId,
        CancellationToken cancellationToken = default
    );
    Task<ServiceRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    IQueryable<ServiceRequest> GetByTenantId(Guid tenantId);
    IQueryable<ServiceRequest> GetByCustomerId(Guid customerId, Guid tenantId);
    IQueryable<ServiceRequest> GetByWorkerId(Guid workerId, Guid tenantId);
    Task<ServiceRequest> AddAsync(
        ServiceRequest serviceRequest,
        CancellationToken cancellationToken = default
    );
    Task UpdateAsync(ServiceRequest serviceRequest, CancellationToken cancellationToken = default);
}
