using FixIt.Domain.Constants;
using FixIt.Domain.Exceptions;

namespace FixIt.Domain.Entities;

public class Tenant : BaseEntity
{
    // Shared with the EF Core column configuration so validation and schema cannot drift apart
    public const int NameMaxLength = 200;
    public const int DescriptionMaxLength = 1000;
    public const int ContactEmailMaxLength = 256;
    public const int PhoneMaxLength = 30;
    public const int AddressMaxLength = 300;
    public const int TimezoneMaxLength = 64;
    public const int PlanMaxLength = 20;
    public const string DefaultTimezone = "Europe/Warsaw";

    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool IsActive { get; private set; } = true;
    public string? ContactEmail { get; private set; }
    public string? Phone { get; private set; }
    public string? Address { get; private set; }
    public string Timezone { get; private set; } = DefaultTimezone;
    public string Plan { get; private set; } = TenantPlans.Team;

    private Tenant() { }

    public Tenant(Guid id, string name, string? description = null)
    {
        Id = id;
        TenantId = id;
        Name = name;
        Description = description;
    }

    public void UpdateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new TenantNameRequiredException();

        Name = name;
    }

    /// <summary>
    /// Full replacement of the editable settings. Everything is validated before anything is
    /// assigned, so a rejected update never leaves the tenant half-modified.
    /// The plan is deliberately not a parameter: it is owned by billing, not by tenant admins.
    /// </summary>
    public void UpdateSettings(
        string? name,
        string? description,
        string? contactEmail,
        string? phone,
        string? address,
        string? timezone
    )
    {
        var normalizedName = Normalize(name) ?? throw new TenantNameRequiredException();
        if (normalizedName.Length > NameMaxLength)
            throw new TenantNameTooLongException(NameMaxLength);

        var normalizedDescription = Normalize(description);
        if (normalizedDescription?.Length > DescriptionMaxLength)
            throw new TenantDescriptionTooLongException(DescriptionMaxLength);

        var normalizedEmail = Normalize(contactEmail);
        if (
            normalizedEmail is not null
            && (normalizedEmail.Length > ContactEmailMaxLength || !IsPlausibleEmail(normalizedEmail))
        )
            throw new TenantContactEmailInvalidException(ContactEmailMaxLength);

        var normalizedPhone = Normalize(phone);
        if (normalizedPhone?.Length > PhoneMaxLength)
            throw new TenantPhoneTooLongException(PhoneMaxLength);

        var normalizedAddress = Normalize(address);
        if (normalizedAddress?.Length > AddressMaxLength)
            throw new TenantAddressTooLongException(AddressMaxLength);

        var normalizedTimezone = Normalize(timezone);
        if (
            normalizedTimezone is null
            || normalizedTimezone.Length > TimezoneMaxLength
            || !TimeZoneInfo.TryFindSystemTimeZoneById(normalizedTimezone, out _)
        )
            throw new TenantTimezoneInvalidException(timezone);

        Name = normalizedName;
        Description = normalizedDescription;
        ContactEmail = normalizedEmail;
        Phone = normalizedPhone;
        Address = normalizedAddress;
        Timezone = normalizedTimezone;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void Activate()
    {
        if (IsDeleted)
            throw new TenantCannotBeActivatedException(Id);

        IsActive = true;
    }

    public new void SoftDelete()
    {
        IsDeleted = true;
        IsActive = false;
    }

    // Intentionally loose (one "@", text on both sides, a dot in the domain): the address is only
    // shown to people, so the goal is catching typos, not RFC 5322 compliance
    private static bool IsPlausibleEmail(string email)
    {
        var parts = email.Split('@');
        return parts.Length == 2
            && parts[0].Length > 0
            && parts[1].Length > 0
            && parts[1].Contains('.');
    }

    // Blank optional fields are stored as null so "not provided" has a single representation
    private static string? Normalize(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }
}
