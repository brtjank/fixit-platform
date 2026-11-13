using FixIt.Domain.Exceptions;

namespace FixIt.Domain.Entities;

public class WorkerProfile : BaseEntity
{
    // Shared with the EF Core column configuration so validation and schema cannot drift apart
    public const int SpecializationMaxLength = 200;
    public const int PhoneNumberMaxLength = 20;

    public Guid UserId { get; private set; }
    public string? Specialization { get; private set; }
    public string? PhoneNumber { get; private set; }
    public bool IsAvailable { get; private set; } = true;

    private WorkerProfile() { }

    public WorkerProfile(
        Guid tenantId,
        Guid userId,
        string? specialization = null,
        string? phoneNumber = null
    )
        : base(tenantId)
    {
        UserId = userId;
        UpdateSpecialization(specialization);
        UpdatePhoneNumber(phoneNumber);
    }

    public void UpdateSpecialization(string? specialization)
    {
        var normalized = Normalize(specialization);
        if (normalized?.Length > SpecializationMaxLength)
            throw new WorkerProfileSpecializationTooLongException(SpecializationMaxLength);

        Specialization = normalized;
    }

    public void UpdatePhoneNumber(string? phoneNumber)
    {
        var normalized = Normalize(phoneNumber);
        if (normalized?.Length > PhoneNumberMaxLength)
            throw new WorkerProfilePhoneNumberTooLongException(PhoneNumberMaxLength);

        PhoneNumber = normalized;
    }

    public void SetAvailable()
    {
        IsAvailable = true;
    }

    public void SetUnavailable()
    {
        IsAvailable = false;
    }

    // Blank optional fields are stored as null so "not provided" has a single representation
    private static string? Normalize(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }
}
