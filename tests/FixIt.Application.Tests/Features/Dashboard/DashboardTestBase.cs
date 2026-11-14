using FixIt.Application.Interfaces.Services;
using FixIt.Application.Tests.Common.Builders;
using FixIt.Application.Tests.Common.Fakes;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using Moq;

namespace FixIt.Application.Tests.Features.Dashboard;

/// <summary>Shared arrangement helpers for the dashboard handlers (fixed clock, one tenant).</summary>
public abstract class DashboardTestBase
{
    protected static readonly DateTime Now = new(2026, 6, 15, 12, 0, 0, DateTimeKind.Utc);

    protected readonly InMemoryTenantData Data = new();
    protected readonly Mock<ICurrentUserService> CurrentUser = new();
    protected readonly InMemoryQueryableExecutor Executor = new();
    protected readonly FixedDateTimeProvider Clock = new(Now);
    protected readonly Guid TenantId = Guid.NewGuid();

    protected DashboardTestBase()
    {
        CurrentUser.Setup(x => x.TenantId).Returns(TenantId);
    }

    protected User AddUser(UserRole role, string firstName = "John", string lastName = "Doe")
    {
        var user = new UserBuilder()
            .WithTenantId(TenantId)
            .WithRole(role)
            .WithName(firstName, lastName)
            .Build();
        Data.Users.Add(user);
        return user;
    }

    protected ServiceRequest AddRequest(
        ServiceRequestStatus status = ServiceRequestStatus.Pending,
        DateTime? createdAt = null,
        Guid? customerId = null,
        string title = "Leaking tap"
    )
    {
        var builder = new ServiceRequestBuilder()
            .WithTenantId(TenantId)
            .WithTitle(title)
            .WithStatus(status)
            .CreatedAt(createdAt ?? Now.AddDays(-1));
        if (customerId is not null)
            builder.WithCustomerId(customerId.Value);
        var request = builder.Build();
        Data.Requests.Add(request);
        return request;
    }

    protected ServiceLog AddLog(
        ServiceRequest request,
        ServiceRequestStatus previous,
        ServiceRequestStatus next,
        DateTime at,
        string? notes = null,
        Guid? changedBy = null
    )
    {
        var log = new ServiceLog(TenantId, request.Id, previous, next, notes, changedBy)
            .WithCreatedAt(at);
        Data.Logs.Add(log);
        return log;
    }

    protected ServiceRequest AddCompleted(DateTime createdAt, DateTime completedAt)
    {
        var request = AddRequest(ServiceRequestStatus.Completed, createdAt);
        AddLog(request, ServiceRequestStatus.InProgress, ServiceRequestStatus.Completed, completedAt);
        return request;
    }
}
