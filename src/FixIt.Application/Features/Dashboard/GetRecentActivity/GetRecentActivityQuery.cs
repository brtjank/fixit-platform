using MediatR;

namespace FixIt.Application.Features.Dashboard.GetRecentActivity;

/// <param name="Limit">Requested number of items; null (missing or not a number) means the default.</param>
public record GetRecentActivityQuery(int? Limit = null) : IRequest<GetRecentActivityResponse>
{
    public const int DefaultLimit = 10;
    public const int MinLimit = 1;
    public const int MaxLimit = 50;
}
