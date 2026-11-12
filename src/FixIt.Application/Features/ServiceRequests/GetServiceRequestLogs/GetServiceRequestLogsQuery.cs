using MediatR;

namespace FixIt.Application.Features.ServiceRequests.GetServiceRequestLogs;

public record GetServiceRequestLogsQuery(Guid ServiceRequestId)
    : IRequest<GetServiceRequestLogsResponse>;
