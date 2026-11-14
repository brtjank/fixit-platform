using MediatR;

namespace FixIt.Application.Features.Dashboard.GetDashboardStats;

public record GetDashboardStatsQuery : IRequest<GetDashboardStatsResponse>;
