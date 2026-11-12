using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.ServiceRequests.AssignWorker;

public class AssignWorkerCommandHandler : IRequestHandler<AssignWorkerCommand, AssignWorkerResponse>
{
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly IUserRepository _userRepository;
    private readonly IServiceLogRepository _serviceLogRepository;
    private readonly ICurrentUserService _currentUser;

    public AssignWorkerCommandHandler(
        IServiceRequestRepository serviceRequestRepository,
        IUserRepository userRepository,
        IServiceLogRepository serviceLogRepository,
        ICurrentUserService currentUser
    )
    {
        _serviceLogRepository = serviceLogRepository;
        _serviceRequestRepository = serviceRequestRepository;
        _userRepository = userRepository;
        _currentUser = currentUser;
    }

    public async Task<AssignWorkerResponse> Handle(
        AssignWorkerCommand request,
        CancellationToken cancellationToken
    )
    {
        var tenantId = _currentUser.TenantId;

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

        var worker = await _userRepository.GetByIdAsync(
            request.WorkerId,
            tenantId,
            cancellationToken
        );
        if (worker == null)
            throw new ResourceNotFoundException("User", request.WorkerId.ToString());

        // Ownership check: worker must belong to current user's tenant
        if (worker.TenantId != tenantId)
            throw new ResourceNotFoundException("User", request.WorkerId.ToString());

        if (worker.Role != UserRole.Worker)
            throw new UserRoleInvalidException(request.WorkerId, UserRole.Worker, worker.Role);

        var previousStatus = serviceRequest.Status;

        serviceRequest.AssignWorker(request.WorkerId);

        await _serviceRequestRepository.UpdateAsync(serviceRequest, cancellationToken);

        var serviceLog = new ServiceLog(
            tenantId,
            request.ServiceRequestId,
            previousStatus,
            serviceRequest.Status,
            null,
            _currentUser.UserId
        );

        await _serviceLogRepository.AddAsync(serviceLog, cancellationToken);

        return new AssignWorkerResponse(
            serviceRequest.Id,
            serviceRequest.AssignedWorkerId,
            serviceRequest.Status
        );
    }
}
