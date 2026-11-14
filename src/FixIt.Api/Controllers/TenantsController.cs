using FixIt.Application.Features.Tenants.GetCurrentTenant;
using FixIt.Application.Features.Tenants.UpdateCurrentTenant;
using FixIt.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FixIt.Api.Controllers;

[ApiController]
[Route("api/tenants")]
[Authorize]
public class TenantsController : ControllerBase
{
    private readonly IMediator _mediator;

    public TenantsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("current")]
    public async Task<ActionResult<Tenant>> GetCurrentTenant(
        CancellationToken cancellationToken = default
    )
    {
        var response = await _mediator.Send(new GetCurrentTenantQuery(), cancellationToken);

        return Ok(response.Tenant);
    }

    [HttpPut("current")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<Tenant>> UpdateCurrentTenant(
        [FromBody] UpdateCurrentTenantRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var command = new UpdateCurrentTenantCommand(
            request.Name,
            request.Description,
            request.ContactEmail,
            request.Phone,
            request.Address,
            request.Timezone
        );
        var response = await _mediator.Send(command, cancellationToken);

        return Ok(response.Tenant);
    }
}
