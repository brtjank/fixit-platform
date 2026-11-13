namespace FixIt.Application.Common;

/// <summary>
/// A half-open time range <c>(Start, End]</c>: an event exactly on a boundary belongs to the newer
/// window, so consecutive windows never count it twice.
/// </summary>
public readonly record struct TimeWindow(DateTime Start, DateTime End)
{
    public const int DefaultDays = 30;

    public static TimeWindow LastDays(DateTime now, int days = DefaultDays) =>
        new(now.AddDays(-days), now);

    public static TimeWindow PreviousDays(DateTime now, int days = DefaultDays) =>
        new(now.AddDays(-2 * days), now.AddDays(-days));
}
