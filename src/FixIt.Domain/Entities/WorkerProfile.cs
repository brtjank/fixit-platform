namespace FixIt.Domain.Entities;

public class WorkerProfile : BaseEntity
{
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
        Specialization = specialization;
        PhoneNumber = phoneNumber;
    }

    public void UpdateSpecialization(string? specialization)
    {
        Specialization = specialization;
    }

    public void UpdatePhoneNumber(string? phoneNumber)
    {
        PhoneNumber = phoneNumber;
    }

    public void SetAvailable()
    {
        IsAvailable = true;
    }

    public void SetUnavailable()
    {
        IsAvailable = false;
    }
}
