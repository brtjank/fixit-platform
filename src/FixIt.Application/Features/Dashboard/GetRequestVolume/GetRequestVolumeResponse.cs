namespace FixIt.Application.Features.Dashboard.GetRequestVolume;

// DateOnly is serialised by System.Text.Json as "yyyy-MM-dd" (a UTC calendar day here)
public record DailyVolumePoint(DateOnly Date, int Created, int Completed);

public record GetRequestVolumeResponse(IReadOnlyList<DailyVolumePoint> Points);
