namespace FixIt.Application.Interfaces.Services;

/// <summary>
/// Abstracts the clock so date-window logic (dashboard, workload) is deterministic in tests.
/// </summary>
public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
}
