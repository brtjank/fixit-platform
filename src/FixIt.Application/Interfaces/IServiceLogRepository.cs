using FixIt.Domain.Entities;

namespace FixIt.Application.Interfaces;

public interface IServiceLogRepository
{
    Task<IEnumerable<ServiceLog>> GetByServiceRequestIdAsync(
        Guid serviceRequestId,
        Guid tenantId,
        CancellationToken cancellationToken = default
    );
    Task<ServiceLog> AddAsync(ServiceLog serviceLog, CancellationToken cancellationToken = default);
}
