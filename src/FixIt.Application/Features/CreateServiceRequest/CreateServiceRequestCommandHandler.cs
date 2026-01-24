using FixIt.Application.Interfaces;
using FixIt.Domain.Entities;
using FixIt.Domain.Exceptions;
using MediatR;

namespace FixIt.Application.Features.CreateServiceRequest;

public class CreateServiceRequestCommandHandler
    : IRequestHandler<CreateServiceRequestCommand, CreateServiceRequestResponse>
{
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly IUserRepository _userRepository;

    public CreateServiceRequestCommandHandler(
        IServiceRequestRepository serviceRequestRepository,
        IUserRepository userRepository
    )
    {
        _serviceRequestRepository = serviceRequestRepository;
        _userRepository = userRepository;
    }

    public async Task<CreateServiceRequestResponse> Handle(
        CreateServiceRequestCommand request,
        CancellationToken cancellationToken
    )
    {
        var customer = await _userRepository.GetByIdAsync(
            request.CustomerId,
            request.TenantId,
            cancellationToken
        );
        if (customer == null)
            throw new NotFoundException("User", request.CustomerId.ToString());

        var serviceRequest = new ServiceRequest(
            request.TenantId,
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
