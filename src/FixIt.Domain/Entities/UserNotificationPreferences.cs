namespace FixIt.Domain.Entities;

/// <summary>
/// Per-user e-mail notification choices. Only stored for now: nothing sends e-mail until the
/// messaging infrastructure exists. Users without a row get the defaults set below.
/// </summary>
public class UserNotificationPreferences : BaseEntity
{
    public Guid UserId { get; private set; }
    public bool EmailOnNewRequest { get; private set; } = true;
    public bool EmailOnAssignment { get; private set; } = true;
    public bool EmailOnStatusChange { get; private set; } = true;
    public bool DailyDigest { get; private set; }

    private UserNotificationPreferences() { }

    public UserNotificationPreferences(Guid tenantId, Guid userId)
        : base(tenantId)
    {
        UserId = userId;
    }

    public void Update(
        bool emailOnNewRequest,
        bool emailOnAssignment,
        bool emailOnStatusChange,
        bool dailyDigest
    )
    {
        EmailOnNewRequest = emailOnNewRequest;
        EmailOnAssignment = emailOnAssignment;
        EmailOnStatusChange = emailOnStatusChange;
        DailyDigest = dailyDigest;
    }
}
