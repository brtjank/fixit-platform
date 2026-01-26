using FixIt.Application.Features.AssignWorker;
using FixIt.Application.Features.ChangeServiceStatus;
using FixIt.Application.Features.CreateServiceRequest;
using FixIt.Application.Features.GetServiceRequestById;
using FixIt.Application.Features.GetServiceRequests;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FixIt.Api.Controllers;

[ApiController]
[Route("api/service-requests")]
[Authorize]
public class ServiceRequestsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ServiceRequestsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    [Authorize(Policy = "CustomerOrAdmin")]
    public async Task<ActionResult<CreateServiceRequestResponse>> CreateServiceRequest(
        [FromBody] CreateServiceRequestRequest request,
        CancellationToken cancellationToken
    )
    {
        var command = new CreateServiceRequestCommand(
            request.Title,
            request.Description,
            request.CustomerId
        );

        var response = await _mediator.Send(command, cancellationToken);

        return CreatedAtAction(nameof(GetServiceRequest), new { id = response.Id }, response);
    }

    [HttpGet]
    public async Task<ActionResult<GetServiceRequestsResponse>> GetServiceRequests(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] Guid? assignedWorkerId = null,
        CancellationToken cancellationToken = default
    )
    {
        var query = new GetServiceRequestsQuery(
            Page: page,
            PageSize: pageSize,
            Status: status != null
                ? Enum.Parse<FixIt.Domain.Enums.ServiceRequestStatus>(status, ignoreCase: true)
                : null,
            AssignedWorkerId: assignedWorkerId
        );

        var response = await _mediator.Send(query, cancellationToken);

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Domain.Entities.ServiceRequest>> GetServiceRequest(
        Guid id,
        CancellationToken cancellationToken
    )
    {
        var query = new GetServiceRequestByIdQuery(id);
        var response = await _mediator.Send(query, cancellationToken);

        if (response.ServiceRequest == null)
            return NotFound();

        return Ok(response.ServiceRequest);
    }

    [HttpPut("{id}/assign-worker")]
    [Authorize(Policy = "WorkerOrAdmin")]
    public async Task<ActionResult<AssignWorkerResponse>> AssignWorker(
        Guid id,
        [FromBody] AssignWorkerRequest request,
        CancellationToken cancellationToken
    )
    {
        var command = new AssignWorkerCommand(id, request.WorkerId);
        var response = await _mediator.Send(command, cancellationToken);

        return Ok(response);
    }

    [HttpPut("{id}/change-status")]
    [Authorize(Policy = "WorkerOrAdmin")]
    public async Task<ActionResult<ChangeServiceStatusResponse>> ChangeStatus(
        Guid id,
        [FromBody] ChangeServiceStatusRequest request,
        CancellationToken cancellationToken
    )
    {
        var command = new ChangeServiceStatusCommand(id, request.NewStatus, request.Notes);
        var response = await _mediator.Send(command, cancellationToken);

        return Ok(response);
    }
}
