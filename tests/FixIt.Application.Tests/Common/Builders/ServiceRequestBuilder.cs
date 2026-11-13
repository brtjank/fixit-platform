using FixIt.Domain.Entities;
using FixIt.Domain.Enums;

namespace FixIt.Application.Tests.Common.Builders;

public class ServiceRequestBuilder
{
    private Guid _tenantId = Guid.NewGuid();
    private Guid _customerId = Guid.NewGuid();
    private string _title = "Leaking tap";
    private Guid? _workerId;
    private ServiceRequestStatus _status = ServiceRequestStatus.Pending;
    private DateTime? _createdAt;

    public ServiceRequestBuilder WithTenantId(Guid tenantId)
    {
        _tenantId = tenantId;
        return this;
    }

    public ServiceRequestBuilder WithCustomerId(Guid customerId)
    {
        _customerId = customerId;
        return this;
    }

    public ServiceRequestBuilder WithTitle(string title)
    {
        _title = title;
        return this;
    }

    /// <summary>Statuses other than Pending imply an assigned worker, as in the real workflow.</summary>
    public ServiceRequestBuilder WithStatus(ServiceRequestStatus status, Guid? workerId = null)
    {
        _status = status;
        _workerId = workerId;
        return this;
    }

    public ServiceRequestBuilder CreatedAt(DateTime createdAt)
    {
        _createdAt = createdAt;
        return this;
    }

    public ServiceRequest Build()
    {
        var request = new ServiceRequest(_tenantId, _title, "Description", _customerId);
        if (_status != ServiceRequestStatus.Pending)
        {
            request.AssignWorker(_workerId ?? Guid.NewGuid());
            if (_status != ServiceRequestStatus.Assigned)
                request.ChangeStatus(_status);
        }
        if (_createdAt is not null)
            request.WithCreatedAt(_createdAt.Value);
        return request;
    }
}
