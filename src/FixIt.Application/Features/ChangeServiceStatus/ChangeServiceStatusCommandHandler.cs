using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.ChangeServiceStatus;

public class ChangeServiceStatusCommandHandler
    : IRequestHandler<ChangeServiceStatusCommand, ChangeServiceStatusResponse>
{
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly IServiceLogRepository _serviceLogRepository;
    private readonly ICurrentUserService _currentUser;

    public ChangeServiceStatusCommandHandler(
        IServiceRequestRepository serviceRequestRepository,
        IServiceLogRepository serviceLogRepository,
        ICurrentUserService currentUser
    )
    {
        _serviceRequestRepository = serviceRequestRepository;
        _serviceLogRepository = serviceLogRepository;
        _currentUser = currentUser;
    }

    public async Task<ChangeServiceStatusResponse> Handle(
        ChangeServiceStatusCommand request,
        CancellationToken cancellationToken
    )
    {
        var tenantId = _currentUser.TenantId;
        var userId = _currentUser.UserId;

        var serviceRequest = await _serviceRequestRepository.GetByIdAsync(
            request.ServiceRequestId,
            tenantId,
            cancellationToken
        );

        if (serviceRequest == null)
            throw new ResourceNotFoundException(
                "ServiceRequest",
                request.ServiceRequestId.ToString()
            );

        // Ownership check: service request must belong to current user's tenant
        if (serviceRequest.TenantId != tenantId)
            throw new ResourceNotFoundException(
                "ServiceRequest",
                request.ServiceRequestId.ToString()
            );

        var previousStatus = serviceRequest.Status;

        serviceRequest.ChangeStatus(request.NewStatus);

        if (!string.IsNullOrWhiteSpace(request.Notes))
        {
            serviceRequest.UpdateNotes(request.Notes);
        }

        await _serviceRequestRepository.UpdateAsync(serviceRequest, cancellationToken);

        var serviceLog = new ServiceLog(
            tenantId,
            request.ServiceRequestId,
            previousStatus,
            request.NewStatus,
            request.Notes,
            userId
        );

        await _serviceLogRepository.AddAsync(serviceLog, cancellationToken);

        return new ChangeServiceStatusResponse(serviceRequest.Id, serviceRequest.Status);
    }
}
