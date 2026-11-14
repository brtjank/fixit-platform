using FixIt.Application.Interfaces.Services;

namespace FixIt.Infrastructure.Services;

public class DateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
}
