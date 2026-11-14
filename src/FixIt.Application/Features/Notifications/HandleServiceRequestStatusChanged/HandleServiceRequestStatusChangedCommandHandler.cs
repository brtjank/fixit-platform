using FixIt.Application.Common;
using FixIt.Application.Common.Exceptions;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Constants;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FixIt.Application.Features.Notifications.HandleServiceRequestStatusChanged;

/// <summary>
/// Creates in-app notifications for a status change. Idempotent: messages are delivered
/// at least once, so recipients that already have a notification for the event are skipped and a
/// concurrent duplicate insert is treated as already processed.
/// </summary>
public class HandleServiceRequestStatusChangedCommandHandler
    : IRequestHandler<HandleServiceRequestStatusChangedCommand, HandleServiceRequestStatusChangedResponse>
{
    private readonly IServiceRequestRepository _serviceRequestRepository;
    private readonly IUserRepository _userRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly IQueryableExecutor _queryableExecutor;
    private readonly ILogger<HandleServiceRequestStatusChangedCommandHandler> _logger;

    public HandleServiceRequestStatusChangedCommandHandler(
        IServiceRequestRepository serviceRequestRepository,
        IUserRepository userRepository,
        INotificationRepository notificationRepository,
        IQueryableExecutor queryableExecutor,
        ILogger<HandleServiceRequestStatusChangedCommandHandler> logger
    )
    {
        _serviceRequestRepository = serviceRequestRepository;
        _userRepository = userRepository;
        _notificationRepository = notificationRepository;
        _queryableExecutor = queryableExecutor;
        _logger = logger;
    }

    public async Task<HandleServiceRequestStatusChangedResponse> Handle(
        HandleServiceRequestStatusChangedCommand request,
        CancellationToken cancellationToken
    )
    {
        var @event = request.Event;

        var serviceRequest = await _serviceRequestRepository.GetByIdAsync(
            @event.ServiceRequestId,
            @event.TenantId,
            cancellationToken
        );

        // Deleted (or never visible in this tenant): nothing to notify about, and retrying won't help
        if (serviceRequest is null)
        {
            _logger.LogWarning(
                "ServiceRequest {ServiceRequestId} not found in tenant {TenantId}; skipping notifications for event {EventId}",
                @event.ServiceRequestId,
                @event.TenantId,
                @event.EventId
            );
            return new HandleServiceRequestStatusChangedResponse(0);
        }

        var recipientIds = await GetRecipientIdsAsync(serviceRequest, @event.ChangedByUserId, cancellationToken);

        var alreadyNotified = await _queryableExecutor.ToListAsync(
            _notificationRepository
                .GetBySourceEventId(@event.EventId, @event.TenantId)
                .Select(n => n.RecipientUserId),
            cancellationToken
        );

        var notifications = recipientIds
            .Except(alreadyNotified)
            .Select(recipientId => new Notification(
                @event.TenantId,
                recipientId,
                NotificationTypes.ServiceRequestStatusChanged,
                @event.EventId,
                @event.ServiceRequestId,
                @event.PreviousStatus,
                @event.NewStatus,
                @event.ChangedByUserId
            ))
            .ToList();

        if (notifications.Count == 0)
            return new HandleServiceRequestStatusChangedResponse(0);

        try
        {
            await _notificationRepository.AddRangeAsync(notifications, cancellationToken);
        }
        catch (UniqueConstraintViolationException ex)
            when (ex.ConstraintName == UniqueConstraints.NotificationSourceEventRecipient)
        {
            // Another consumer processed the same message concurrently
            _logger.LogInformation(
                "Notifications for event {EventId} were already created by another delivery",
                @event.EventId
            );
            return new HandleServiceRequestStatusChangedResponse(0);
        }

        _logger.LogInformation(
            "Created {Count} notifications for event {EventId} (ServiceRequest {ServiceRequestId}: {PreviousStatus} -> {NewStatus})",
            notifications.Count,
            @event.EventId,
            @event.ServiceRequestId,
            @event.PreviousStatus,
            @event.NewStatus
        );

        return new HandleServiceRequestStatusChangedResponse(notifications.Count);
    }

    // Customer, assigned worker and all admins of the tenant - only active users, never the actor
    private async Task<List<Guid>> GetRecipientIdsAsync(
        ServiceRequest serviceRequest,
        Guid? actorUserId,
        CancellationToken cancellationToken
    )
    {
        var involvedIds = new List<Guid> { serviceRequest.CustomerId };
        if (serviceRequest.AssignedWorkerId is { } workerId)
            involvedIds.Add(workerId);

        var recipientIds = await _queryableExecutor.ToListAsync(
            _userRepository
                .GetByTenantId(serviceRequest.TenantId)
                .Where(u => u.IsActive && (u.Role == UserRole.Admin || involvedIds.Contains(u.Id)))
                .Select(u => u.Id),
            cancellationToken
        );

        return recipientIds.Where(id => id != actorUserId).Distinct().ToList();
    }
}
