using FixIt.Domain.Enums;

namespace FixIt.Domain.Events;

public record ServiceRequestStatusChanged(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid ServiceRequestId,
    ServiceRequestStatus PreviousStatus,
    ServiceRequestStatus NewStatus,
    Guid? ChangedByUserId
) : IDomainEvent;
