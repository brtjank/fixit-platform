using FixIt.Application.Interfaces.Services;

namespace FixIt.Application.Tests.Common.Fakes;

public class FixedDateTimeProvider(DateTime utcNow) : IDateTimeProvider
{
    public DateTime UtcNow { get; } = utcNow;
}
