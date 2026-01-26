using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.GetServiceRequestById;

public class GetServiceRequestByIdQueryHandler
    : IRequestHandler<GetServiceRequestByIdQuery, GetServiceRequestByIdResponse>
{
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly ICurrentUserService _currentUser;

    public GetServiceRequestByIdQueryHandler(
        IServiceRequestRepository serviceRequestRepository,
        ICurrentUserService currentUser
    )
    {
        _serviceRequestRepository = serviceRequestRepository;
        _currentUser = currentUser;
    }

    public async Task<GetServiceRequestByIdResponse> Handle(
        GetServiceRequestByIdQuery request,
        CancellationToken cancellationToken
    )
    {
        var tenantId = _currentUser.TenantId;

        var serviceRequest = await _serviceRequestRepository.GetByIdAsync(
            request.Id,
            tenantId,
            cancellationToken
        );

        if (serviceRequest == null)
            throw new ResourceNotFoundException("ServiceRequest", request.Id.ToString());

        return new GetServiceRequestByIdResponse(serviceRequest);
    }
}
