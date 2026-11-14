namespace FixIt.Application.Common;

/// <summary>
/// Names of database unique indexes that handlers translate into domain errors.
/// Must match the index names created by the migrations.
/// </summary>
public static class UniqueConstraints
{
    public const string UserEmail = "IX_Users_Email_Lower";
    public const string WorkerProfileUser = "IX_WorkerProfiles_TenantId_UserId";
    public const string NotificationSourceEventRecipient =
        "IX_Notifications_SourceEventId_RecipientUserId";
}
