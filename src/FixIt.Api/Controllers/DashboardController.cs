using FixIt.Application.Features.Dashboard.GetDashboardStats;
using FixIt.Application.Features.Dashboard.GetRecentActivity;
using FixIt.Application.Features.Dashboard.GetRequestVolume;
using FixIt.Application.Features.Dashboard.GetStatusBreakdown;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FixIt.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Policy = "WorkerOrAdmin")]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<GetDashboardStatsResponse>> GetStats(
        CancellationToken cancellationToken = default
    )
    {
        var response = await _mediator.Send(new GetDashboardStatsQuery(), cancellationToken);

        return Ok(response);
    }

    [HttpGet("status-breakdown")]
    public async Task<ActionResult<IEnumerable<StatusCount>>> GetStatusBreakdown(
        CancellationToken cancellationToken = default
    )
    {
        var response = await _mediator.Send(new GetStatusBreakdownQuery(), cancellationToken);

        return Ok(response.Items);
    }

    // Query values are bound as strings on purpose: a non-numeric value falls back to the
    // default instead of failing model binding with a 400
    [HttpGet("volume")]
    public async Task<ActionResult<IEnumerable<DailyVolumePoint>>> GetVolume(
        [FromQuery] string? days = null,
        CancellationToken cancellationToken = default
    )
    {
        var response = await _mediator.Send(
            new GetRequestVolumeQuery(ParseOrNull(days)),
            cancellationToken
        );

        return Ok(response.Points);
    }

    [HttpGet("activity")]
    public async Task<ActionResult<IEnumerable<ActivityItem>>> GetActivity(
        [FromQuery] string? limit = null,
        CancellationToken cancellationToken = default
    )
    {
        var response = await _mediator.Send(
            new GetRecentActivityQuery(ParseOrNull(limit)),
            cancellationToken
        );

        return Ok(response.Items);
    }

    private static int? ParseOrNull(string? value) =>
        int.TryParse(value, out var parsed) ? parsed : null;
}
