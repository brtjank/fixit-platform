using FixIt.Application.Features.GetUsers;
using FixIt.Application.Features.GetWorkers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FixIt.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<GetUsersResponse>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default
    )
    {
        var query = new GetUsersQuery(Page: page, PageSize: pageSize);
        var response = await _mediator.Send(query, cancellationToken);

        return Ok(response);
    }

    [HttpGet("workers")]
    [Authorize(Policy = "WorkerOrAdmin")]
    public async Task<ActionResult<GetWorkersResponse>> GetWorkers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default
    )
    {
        var query = new GetWorkersQuery(Page: page, PageSize: pageSize);
        var response = await _mediator.Send(query, cancellationToken);

        return Ok(response);
    }
}
