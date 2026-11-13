using MediatR;

namespace FixIt.Application.Features.Dashboard.GetStatusBreakdown;

public record GetStatusBreakdownQuery : IRequest<GetStatusBreakdownResponse>;
