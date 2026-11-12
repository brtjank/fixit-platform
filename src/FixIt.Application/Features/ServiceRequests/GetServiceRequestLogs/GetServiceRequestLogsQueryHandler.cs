using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.ServiceRequests.GetServiceRequestLogs;

public class GetServiceRequestLogsQueryHandler
    : IRequestHandler<GetServiceRequestLogsQuery, GetServiceRequestLogsResponse>
{
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly IServiceLogRepository _serviceLogRepository;
    private readonly ICurrentUserService _currentUser;

    public GetServiceRequestLogsQueryHandler(
        IServiceRequestRepository serviceRequestRepository,
        IServiceLogRepository serviceLogRepository,
        ICurrentUserService currentUser
    )
    {
        _serviceRequestRepository = serviceRequestRepository;
        _serviceLogRepository = serviceLogRepository;
        _currentUser = currentUser;
    }

    public async Task<GetServiceRequestLogsResponse> Handle(
        GetServiceRequestLogsQuery request,
        CancellationToken cancellationToken
    )
    {
        var tenantId = _currentUser.TenantId;

        var serviceRequest = await _serviceRequestRepository.GetByIdAsync(
            request.ServiceRequestId,
            tenantId,
            cancellationToken
        );

        // Ownership check: service request must exist and belong to current user's tenant
        if (serviceRequest == null || serviceRequest.TenantId != tenantId)
            throw new ResourceNotFoundException(
                "ServiceRequest",
                request.ServiceRequestId.ToString()
            );

        // Customers may only view history of their own service requests
        if (
            _currentUser.Role == nameof(UserRole.Customer)
            && serviceRequest.CustomerId != _currentUser.UserId
        )
            throw new ResourceNotFoundException(
                "ServiceRequest",
                request.ServiceRequestId.ToString()
            );

        var logs = await _serviceLogRepository.GetByServiceRequestIdAsync(
            request.ServiceRequestId,
            tenantId,
            cancellationToken
        );

        // Timeline is chronological (oldest first)
        return new GetServiceRequestLogsResponse(logs.OrderBy(l => l.CreatedAt).ToList());
    }
}
