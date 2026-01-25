using FixIt.Application.Interfaces;
using FixIt.Application.Services;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.AssignWorker;

public class AssignWorkerCommandHandler : IRequestHandler<AssignWorkerCommand, AssignWorkerResponse>
{
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;

    public AssignWorkerCommandHandler(
        IServiceRequestRepository serviceRequestRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUser
    )
    {
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
            throw new NotFoundException("ServiceRequest", request.ServiceRequestId.ToString());

        // Ownership check: service request must belong to current user's tenant
        if (serviceRequest.TenantId != tenantId)
            throw new NotFoundException("ServiceRequest", request.ServiceRequestId.ToString());

        var worker = await _userRepository.GetByIdAsync(
            request.WorkerId,
            tenantId,
            cancellationToken
        );
        if (worker == null)
            throw new NotFoundException("User", request.WorkerId.ToString());

        // Ownership check: worker must belong to current user's tenant
        if (worker.TenantId != tenantId)
            throw new NotFoundException("User", request.WorkerId.ToString());

        if (worker.Role != UserRole.Worker)
            throw new BadRequestException($"User with id {request.WorkerId} is not a Worker.");

        serviceRequest.AssignWorker(request.WorkerId);

        await _serviceRequestRepository.UpdateAsync(serviceRequest, cancellationToken);

        return new AssignWorkerResponse(
            serviceRequest.Id,
            serviceRequest.AssignedWorkerId,
            serviceRequest.Status
        );
    }
}
