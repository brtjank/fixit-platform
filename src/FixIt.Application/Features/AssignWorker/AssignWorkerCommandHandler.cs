using FixIt.Application.Interfaces;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.AssignWorker;

public class AssignWorkerCommandHandler : IRequestHandler<AssignWorkerCommand, AssignWorkerResponse>
{
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly IUserRepository _userRepository;

    public AssignWorkerCommandHandler(
        IServiceRequestRepository serviceRequestRepository,
        IUserRepository userRepository
    )
    {
        _serviceRequestRepository = serviceRequestRepository;
        _userRepository = userRepository;
    }

    public async Task<AssignWorkerResponse> Handle(
        AssignWorkerCommand request,
        CancellationToken cancellationToken
    )
    {
        var serviceRequest = await _serviceRequestRepository.GetByIdAsync(
            request.ServiceRequestId,
            request.TenantId,
            cancellationToken
        );

        if (serviceRequest == null)
            throw new NotFoundException("ServiceRequest", request.ServiceRequestId.ToString());

        var worker = await _userRepository.GetByIdAsync(
            request.WorkerId,
            request.TenantId,
            cancellationToken
        );
        if (worker == null)
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
