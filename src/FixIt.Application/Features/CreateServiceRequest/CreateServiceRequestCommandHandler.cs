using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.CreateServiceRequest;

public class CreateServiceRequestCommandHandler
    : IRequestHandler<CreateServiceRequestCommand, CreateServiceRequestResponse>
{
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;

    public CreateServiceRequestCommandHandler(
        IServiceRequestRepository serviceRequestRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUser
    )
    {
        _serviceRequestRepository = serviceRequestRepository;
        _userRepository = userRepository;
        _currentUser = currentUser;
    }

    public async Task<CreateServiceRequestResponse> Handle(
        CreateServiceRequestCommand request,
        CancellationToken cancellationToken
    )
    {
        var tenantId = _currentUser.TenantId;

        var customer = await _userRepository.GetByIdAsync(
            request.CustomerId,
            tenantId,
            cancellationToken
        );
        if (customer == null)
            throw new NotFoundException("User", request.CustomerId.ToString());

        // Ownership check: customer must belong to current user's tenant
        if (customer.TenantId != tenantId)
            throw new NotFoundException("User", request.CustomerId.ToString());

        var serviceRequest = new ServiceRequest(
            tenantId,
            request.Title,
            request.Description,
            request.CustomerId
        );

        var createdServiceRequest = await _serviceRequestRepository.AddAsync(
            serviceRequest,
            cancellationToken
        );

        return new CreateServiceRequestResponse(
            createdServiceRequest.Id,
            createdServiceRequest.Title,
            createdServiceRequest.Description,
            createdServiceRequest.CustomerId,
            createdServiceRequest.Status,
            createdServiceRequest.CreatedAt
        );
    }
}
