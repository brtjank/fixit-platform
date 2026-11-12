using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.ServiceRequests.GetServiceRequestById;

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

        if (serviceRequest == null || serviceRequest.TenantId != tenantId)
            throw new ResourceNotFoundException("ServiceRequest", request.Id.ToString());

        // Customers may only view their own service requests (do not reveal existence)
        if (
            _currentUser.Role == nameof(UserRole.Customer)
            && serviceRequest.CustomerId != _currentUser.UserId
        )
            throw new ResourceNotFoundException("ServiceRequest", request.Id.ToString());

        return new GetServiceRequestByIdResponse(serviceRequest);
    }
}
