using MediatR;

namespace FixIt.Application.Features.GetServiceRequestById;

public record GetServiceRequestByIdQuery(Guid Id) : IRequest<GetServiceRequestByIdResponse>;
