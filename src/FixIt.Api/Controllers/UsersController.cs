using FixIt.Application.Features.Users.ActivateUser;
using FixIt.Application.Features.Users.ChangeOwnPassword;
using FixIt.Application.Features.Users.CreateUser;
using FixIt.Application.Features.Users.DeactivateUser;
using FixIt.Application.Features.Users.GetCurrentUser;
using FixIt.Application.Features.Users.GetUserById;
using FixIt.Application.Features.Users.GetUsers;
using FixIt.Application.Features.Users.GetWorkers;
using FixIt.Application.Features.Users.ResetUserPassword;
using FixIt.Application.Features.Users.UpdateUser;
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

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<User>> CreateUser(
        [FromBody] CreateUserRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var command = new CreateUserCommand(
            request.Email,
            request.FirstName,
            request.LastName,
            request.Role,
            request.Password
        );
        var response = await _mediator.Send(command, cancellationToken);

        return CreatedAtAction(nameof(GetUserById), new { id = response.User.Id }, response.User);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<User>> UpdateUser(
        Guid id,
        [FromBody] UpdateUserRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var command = new UpdateUserCommand(id, request.FirstName, request.LastName, request.Role);
        var response = await _mediator.Send(command, cancellationToken);

        return Ok(response.User);
    }

    [HttpPut("{id:guid}/activate")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<User>> ActivateUser(
        Guid id,
        CancellationToken cancellationToken = default
    )
    {
        var response = await _mediator.Send(new ActivateUserCommand(id), cancellationToken);

        return Ok(response.User);
    }

    [HttpPut("{id:guid}/deactivate")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<User>> DeactivateUser(
        Guid id,
        CancellationToken cancellationToken = default
    )
    {
        var response = await _mediator.Send(new DeactivateUserCommand(id), cancellationToken);

        return Ok(response.User);
    }

    // "me" is not a guid, so this never collides with the {id:guid}/password route below
    [HttpPut("me/password")]
    public async Task<IActionResult> ChangeOwnPassword(
        [FromBody] ChangeOwnPasswordRequest request,
        CancellationToken cancellationToken = default
    )
    {
        await _mediator.Send(
            new ChangeOwnPasswordCommand(request.CurrentPassword, request.NewPassword),
            cancellationToken
        );

        return NoContent();
    }

    [HttpPut("{id:guid}/password")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> ResetUserPassword(
        Guid id,
        [FromBody] ResetUserPasswordRequest request,
        CancellationToken cancellationToken = default
    )
    {
        await _mediator.Send(new ResetUserPasswordCommand(id, request.NewPassword), cancellationToken);

        return NoContent();
    }
}
