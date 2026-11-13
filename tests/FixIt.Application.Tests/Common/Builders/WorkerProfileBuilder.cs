using FixIt.Domain.Entities;

namespace FixIt.Application.Tests.Common.Builders;

public class WorkerProfileBuilder
{
    private Guid _tenantId = Guid.NewGuid();
    private Guid _userId = Guid.NewGuid();
    private string? _specialization = "Plumbing";
    private string? _phoneNumber = "+48 600 100 200";
    private bool _isAvailable = true;

    public WorkerProfileBuilder WithTenantId(Guid tenantId)
    {
        _tenantId = tenantId;
        return this;
    }

    public WorkerProfileBuilder WithUserId(Guid userId)
    {
        _userId = userId;
        return this;
    }

    public WorkerProfileBuilder WithSpecialization(string? specialization)
    {
        _specialization = specialization;
        return this;
    }

    public WorkerProfileBuilder WithPhoneNumber(string? phoneNumber)
    {
        _phoneNumber = phoneNumber;
        return this;
    }

    public WorkerProfileBuilder AsUnavailable()
    {
        _isAvailable = false;
        return this;
    }

    public WorkerProfile Build()
    {
        var profile = new WorkerProfile(_tenantId, _userId, _specialization, _phoneNumber);
        if (!_isAvailable)
        {
            profile.SetUnavailable();
        }
        return profile;
    }
}
