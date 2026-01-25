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
    Task<IEnumerable<ServiceRequest>> GetByTenantIdAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default
    );
    Task<IEnumerable<ServiceRequest>> GetByCustomerIdAsync(
        Guid customerId,
        Guid tenantId,
        CancellationToken cancellationToken = default
    );
    Task<IEnumerable<ServiceRequest>> GetByWorkerIdAsync(
        Guid workerId,
        Guid tenantId,
        CancellationToken cancellationToken = default
    );
    Task<ServiceRequest> AddAsync(
        ServiceRequest serviceRequest,
        CancellationToken cancellationToken = default
    );
    Task UpdateAsync(ServiceRequest serviceRequest, CancellationToken cancellationToken = default);
}
