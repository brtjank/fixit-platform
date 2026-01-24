using FixIt.Domain.Enums;
using MediatR;

namespace FixIt.Application.Features.ChangeServiceStatus;

public record ChangeServiceStatusCommand(
    Guid TenantId,
    Guid ServiceRequestId,
    ServiceRequestStatus NewStatus,
    string? Notes = null,
    Guid? ChangedByUserId = null
) : IRequest<ChangeServiceStatusResponse>;
