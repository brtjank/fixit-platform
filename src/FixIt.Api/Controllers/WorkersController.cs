using FixIt.Application.Features.Workers.GetWorkerProfile;
using FixIt.Application.Features.Workers.GetWorkerProfiles;
using FixIt.Application.Features.Workers.UpdateWorkerProfile;
using FixIt.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FixIt.Api.Controllers;

[ApiController]
[Route("api/workers")]
[Authorize]
public class WorkersController : ControllerBase
{
    private readonly IMediator _mediator;

    public WorkersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("profiles")]
    [Authorize(Policy = "WorkerOrAdmin")]
    public async Task<ActionResult<IEnumerable<WorkerProfile>>> GetWorkerProfiles(
        CancellationToken cancellationToken = default
    )
    {
        var response = await _mediator.Send(new GetWorkerProfilesQuery(), cancellationToken);

        return Ok(response.Profiles);
    }

    [HttpGet("{userId:guid}/profile")]
    public async Task<ActionResult<WorkerProfile>> GetWorkerProfile(
        Guid userId,
        CancellationToken cancellationToken = default
    )
    {
        var response = await _mediator.Send(new GetWorkerProfileQuery(userId), cancellationToken);

        return Ok(response.Profile);
    }

    [HttpPut("{userId:guid}/profile")]
    [Authorize(Policy = "WorkerOrAdmin")]
    public async Task<ActionResult<WorkerProfile>> UpdateWorkerProfile(
        Guid userId,
        [FromBody] UpdateWorkerProfileRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var command = new UpdateWorkerProfileCommand(
            userId,
            request.Specialization,
            request.PhoneNumber,
            request.IsAvailable
        );
        var response = await _mediator.Send(command, cancellationToken);

        return Ok(response.Profile);
    }
}
