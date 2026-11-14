using FixIt.Domain.Events;
using MediatR;

namespace FixIt.Application.Features.Notifications.HandleServiceRequestStatusChanged;

/// <summary>
/// Dispatched by the queue consumer (no HTTP context): the tenant comes from the event itself,
/// never from <c>ICurrentUserService</c>.
/// </summary>
public record HandleServiceRequestStatusChangedCommand(ServiceRequestStatusChanged Event)
    : IRequest<HandleServiceRequestStatusChangedResponse>;
