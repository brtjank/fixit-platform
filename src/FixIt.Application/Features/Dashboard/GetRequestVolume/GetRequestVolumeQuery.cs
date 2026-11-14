using MediatR;

namespace FixIt.Application.Features.Dashboard.GetRequestVolume;

/// <param name="Days">Requested number of days; null (missing or not a number) means the default.</param>
public record GetRequestVolumeQuery(int? Days = null) : IRequest<GetRequestVolumeResponse>
{
    public const int DefaultDays = 30;
    public const int MinDays = 7;
    public const int MaxDays = 90;
}
