using FixIt.Application.Interfaces;
using FixIt.Domain.Entities;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.ChangeServiceStatus;

public class ChangeServiceStatusCommandHandler
    : IRequestHandler<ChangeServiceStatusCommand, ChangeServiceStatusResponse>
{
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly IServiceLogRepository _serviceLogRepository;

    public ChangeServiceStatusCommandHandler(
        IServiceRequestRepository serviceRequestRepository,
        IServiceLogRepository serviceLogRepository
    )
    {
        _serviceRequestRepository = serviceRequestRepository;
        _serviceLogRepository = serviceLogRepository;
    }

    public async Task<ChangeServiceStatusResponse> Handle(
        ChangeServiceStatusCommand request,
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

        var previousStatus = serviceRequest.Status;

        serviceRequest.ChangeStatus(request.NewStatus);

        if (!string.IsNullOrWhiteSpace(request.Notes))
        {
            serviceRequest.UpdateNotes(request.Notes);
        }

        await _serviceRequestRepository.UpdateAsync(serviceRequest, cancellationToken);

        var serviceLog = new ServiceLog(
            request.TenantId,
            request.ServiceRequestId,
            previousStatus,
            request.NewStatus,
            request.Notes,
            request.ChangedByUserId
        );

        await _serviceLogRepository.AddAsync(serviceLog, cancellationToken);

        return new ChangeServiceStatusResponse(serviceRequest.Id, serviceRequest.Status);
    }
}
