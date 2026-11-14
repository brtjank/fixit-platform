using FixIt.Application.Features.Notifications.Common;
using FixIt.Application.Features.Notifications.GetNotifications;
using FixIt.Application.Features.Notifications.GetUnreadNotificationCount;
using FixIt.Application.Features.Notifications.MarkAllNotificationsRead;
using FixIt.Application.Features.Notifications.MarkNotificationRead;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FixIt.Api.Controllers;

/// <summary>
/// In-app notifications of the signed-in user (any role). Only the caller's own notifications are
/// visible; anyone else's id is reported as not found.
/// </summary>
[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Newest first. <paramref name="limit"/> is clamped to 1..100 (default 20).</summary>
    // limit is bound as a string on purpose: a non-numeric value falls back to the default
    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetNotifications(
        [FromQuery] bool unreadOnly = false,
        [FromQuery] string? limit = null,
        CancellationToken cancellationToken = default
    )
    {
        var response = await _mediator.Send(
            new GetNotificationsQuery(unreadOnly, int.TryParse(limit, out var parsed) ? parsed : null),
            cancellationToken
        );

        return Ok(response.Items);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<GetUnreadNotificationCountResponse>> GetUnreadCount(
        CancellationToken cancellationToken = default
    )
    {
        var response = await _mediator.Send(
            new GetUnreadNotificationCountQuery(),
            cancellationToken
        );

        return Ok(response);
    }

    /// <summary>Idempotent: marking an already read notification keeps its original read time.</summary>
    [HttpPut("{id:guid}/read")]
    public async Task<ActionResult<NotificationDto>> MarkRead(
        Guid id,
        CancellationToken cancellationToken = default
    )
    {
        var response = await _mediator.Send(new MarkNotificationReadCommand(id), cancellationToken);

        return Ok(response);
    }

    [HttpPut("read-all")]
    public async Task<ActionResult<MarkAllNotificationsReadResponse>> MarkAllRead(
        CancellationToken cancellationToken = default
    )
    {
        var response = await _mediator.Send(
            new MarkAllNotificationsReadCommand(),
            cancellationToken
        );

        return Ok(response);
    }
}
