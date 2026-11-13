namespace FixIt.Domain.Exceptions;

public class TenantTimezoneInvalidException : BadRequestException
{
    public string? Timezone { get; }

    public TenantTimezoneInvalidException(string? timezone)
        : base(
            errorCode: "TEN_007_TIMEZONE_INVALID",
            message: $"'{timezone}' is not a known IANA time zone id."
        )
    {
        Timezone = timezone;
    }
}
