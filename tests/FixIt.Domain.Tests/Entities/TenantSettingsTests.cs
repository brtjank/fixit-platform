using FixIt.Domain.Constants;
using FixIt.Domain.Entities;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Xunit;

namespace FixIt.Domain.Tests.Entities;

public class TenantSettingsTests
{
    private readonly Tenant _tenant = new(Guid.NewGuid(), "Hydro-Serwis", "Plumbing");

    [Fact]
    public void NewTenant_HasDefaultTimezoneAndPlan()
    {
        _tenant.Timezone.Should().Be("Europe/Warsaw");
        _tenant.Plan.Should().Be(TenantPlans.Team);
    }

    [Fact]
    public void UpdateSettings_ValidValues_TrimsAndStoresThem()
    {
        // Act
        _tenant.UpdateSettings(
            "  Hydro-Serwis Nowak  ",
            " Plumbing & HVAC ",
            " biuro@hydro-serwis.pl ",
            " +48 22 123 45 67 ",
            " ul. Wodna 12 ",
            " Europe/London "
        );

        // Assert
        _tenant.Name.Should().Be("Hydro-Serwis Nowak");
        _tenant.Description.Should().Be("Plumbing & HVAC");
        _tenant.ContactEmail.Should().Be("biuro@hydro-serwis.pl");
        _tenant.Phone.Should().Be("+48 22 123 45 67");
        _tenant.Address.Should().Be("ul. Wodna 12");
        _tenant.Timezone.Should().Be("Europe/London");
        _tenant.Plan.Should().Be(TenantPlans.Team);
    }

    [Fact]
    public void UpdateSettings_BlankOptionalValues_StoredAsNull()
    {
        // Act
        _tenant.UpdateSettings("Hydro", "   ", "", null, " ", "UTC");

        // Assert
        _tenant.Description.Should().BeNull();
        _tenant.ContactEmail.Should().BeNull();
        _tenant.Phone.Should().BeNull();
        _tenant.Address.Should().BeNull();
    }

    [Fact]
    public void UpdateSettings_ValuesAtMaxLength_AreAccepted()
    {
        // Arrange
        var email = new string('a', Tenant.ContactEmailMaxLength - "@x.pl".Length) + "@x.pl";

        // Act
        _tenant.UpdateSettings(
            new string('n', Tenant.NameMaxLength),
            new string('d', Tenant.DescriptionMaxLength),
            email,
            new string('1', Tenant.PhoneMaxLength),
            new string('a', Tenant.AddressMaxLength),
            "UTC"
        );

        // Assert
        _tenant.Name.Should().HaveLength(Tenant.NameMaxLength);
        _tenant.ContactEmail.Should().HaveLength(Tenant.ContactEmailMaxLength);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void UpdateSettings_MissingName_ThrowsTen001(string? name)
    {
        AssertRejected(() => Update(name: name), "TEN_001_NAME_REQUIRED");
    }

    [Fact]
    public void UpdateSettings_NameTooLong_ThrowsTen003()
    {
        AssertRejected(
            () => Update(name: new string('n', Tenant.NameMaxLength + 1)),
            "TEN_003_NAME_TOO_LONG"
        );
    }

    [Theory]
    [InlineData("biuro")]
    [InlineData("biuro@")]
    [InlineData("@hydro.pl")]
    [InlineData("biuro@hydro")]
    [InlineData("a@b@hydro.pl")]
    public void UpdateSettings_InvalidEmail_ThrowsTen004(string email)
    {
        AssertRejected(() => Update(contactEmail: email), "TEN_004_CONTACT_EMAIL_INVALID");
    }

    [Fact]
    public void UpdateSettings_EmailTooLong_ThrowsTen004()
    {
        var email = new string('a', Tenant.ContactEmailMaxLength) + "@x.pl";
        AssertRejected(() => Update(contactEmail: email), "TEN_004_CONTACT_EMAIL_INVALID");
    }

    [Fact]
    public void UpdateSettings_PhoneTooLong_ThrowsTen005()
    {
        AssertRejected(
            () => Update(phone: new string('1', Tenant.PhoneMaxLength + 1)),
            "TEN_005_PHONE_TOO_LONG"
        );
    }

    [Fact]
    public void UpdateSettings_AddressTooLong_ThrowsTen006()
    {
        AssertRejected(
            () => Update(address: new string('a', Tenant.AddressMaxLength + 1)),
            "TEN_006_ADDRESS_TOO_LONG"
        );
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Mars/Olympus_Mons")]
    public void UpdateSettings_UnknownTimezone_ThrowsTen007(string? timezone)
    {
        AssertRejected(() => Update(timezone: timezone), "TEN_007_TIMEZONE_INVALID");
    }

    [Fact]
    public void UpdateSettings_DescriptionTooLong_ThrowsTen008()
    {
        AssertRejected(
            () => Update(description: new string('d', Tenant.DescriptionMaxLength + 1)),
            "TEN_008_DESCRIPTION_TOO_LONG"
        );
    }

    private void Update(
        string? name = "Hydro",
        string? description = null,
        string? contactEmail = null,
        string? phone = null,
        string? address = null,
        string? timezone = "Europe/Warsaw"
    ) => _tenant.UpdateSettings(name, description, contactEmail, phone, address, timezone);

    // A rejected update must not change anything, not even the fields validated before the failure
    private void AssertRejected(Action act, string errorCode)
    {
        act.Should().Throw<BadRequestException>().Which.ErrorCode.Should().Be(errorCode);
        _tenant.Name.Should().Be("Hydro-Serwis");
        _tenant.Description.Should().Be("Plumbing");
        _tenant.Timezone.Should().Be("Europe/Warsaw");
    }
}
