using FixIt.Domain.Enums;
using MediatR;

namespace FixIt.Application.Features.ServiceRequests.ChangeServiceStatus;

public record ChangeServiceStatusCommand(
    Guid ServiceRequestId,
    ServiceRequestStatus NewStatus,
    string? Notes = null
) : IRequest<ChangeServiceStatusResponse>;
