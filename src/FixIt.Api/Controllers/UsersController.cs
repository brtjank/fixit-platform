using FixIt.Application.Features.Users.GetCurrentUser;
using FixIt.Application.Features.Users.GetUserById;
using FixIt.Application.Features.Users.GetUsers;
using FixIt.Application.Features.Users.GetWorkers;
using FixIt.Domain.Entities;
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

    [HttpGet("me")]
    public async Task<ActionResult<GetCurrentUserResponse>> GetCurrentUser(
        CancellationToken cancellationToken = default
    )
    {
        var response = await _mediator.Send(new GetCurrentUserQuery(), cancellationToken);

        return Ok(response);
    }

    // The guid constraint keeps literal segments such as "workers" and "me" routed to their own actions
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<User>> GetUserById(
        Guid id,
        CancellationToken cancellationToken = default
    )
    {
        var response = await _mediator.Send(new GetUserByIdQuery(id), cancellationToken);

        return Ok(response.User);
    }
}
