using MediatR;

namespace FixIt.Application.Features.ServiceRequests.GetServiceRequestById;

public record GetServiceRequestByIdQuery(Guid Id) : IRequest<GetServiceRequestByIdResponse>;
