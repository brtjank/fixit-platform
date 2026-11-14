namespace FixIt.Domain.Constants;

/// <summary>
/// Subscription plans exposed to clients as lower-case strings. Plans are assigned outside the
/// tenant settings flow (billing), so tenants can read but never change them.
/// </summary>
public static class TenantPlans
{
    public const string Starter = "starter";
    public const string Team = "team";
    public const string Business = "business";
}
