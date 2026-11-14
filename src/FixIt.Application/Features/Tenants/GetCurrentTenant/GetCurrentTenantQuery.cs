using MediatR;

namespace FixIt.Application.Features.Tenants.GetCurrentTenant;

public record GetCurrentTenantQuery : IRequest<GetCurrentTenantResponse>;
