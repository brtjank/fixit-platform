using FixIt.Application.Features.Workers.GetWorkerWorkload;
using FixIt.Application.Interfaces.Services;
using FixIt.Application.Tests.Common.Builders;
using FixIt.Application.Tests.Common.Fakes;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.GetWorkerWorkload;

public class GetWorkerWorkloadQueryHandlerTests
{
    private static readonly DateTime Now = new(2026, 6, 15, 12, 0, 0, DateTimeKind.Utc);

    private readonly InMemoryTenantData _data = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly GetWorkerWorkloadQueryHandler _handler;
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly User _worker;

    public GetWorkerWorkloadQueryHandlerTests()
    {
        _worker = AddWorker(Now.AddDays(-100));
        _currentUserServiceMock.Setup(x => x.TenantId).Returns(_tenantId);
        _handler = new GetWorkerWorkloadQueryHandler(
            _data.UserRepository.Object,
            _data.ServiceRequestRepository.Object,
            _data.ServiceLogRepository.Object,
            _currentUserServiceMock.Object,
            new InMemoryQueryableExecutor(),
            new FixedDateTimeProvider(Now)
        );
    }

    [Fact]
    public async Task Handle_MixedStatuses_CountsAssignedAndInProgressAsOpen()
    {
        // Arrange
        AddRequest(ServiceRequestStatus.Assigned, _worker.Id);
        AddRequest(ServiceRequestStatus.InProgress, _worker.Id);
        AddRequest(ServiceRequestStatus.InProgress, _worker.Id);
        AddRequest(ServiceRequestStatus.Cancelled, _worker.Id);
        AddRequest(ServiceRequestStatus.Pending);

        // Act
        var result = await _handler.Handle(new GetWorkerWorkloadQuery(), CancellationToken.None);

        // Assert
        result.Workers.Should().ContainSingle()
            .Which.Should().Be(new WorkerWorkload(_worker.Id, 3, 2, 0));
    }

    [Fact]
    public async Task Handle_CompletedRequests_CountsOnlyThoseCompletedInLast30DaysByLogDate()
    {
        // Arrange
        // Created long ago but completed recently: counts, because the window is about completion
        CompleteRequest(createdAt: Now.AddDays(-90), completedAt: Now.AddDays(-10));
        // Created recently but completed before the window: does not count
        CompleteRequest(createdAt: Now.AddDays(-45), completedAt: Now.AddDays(-31));
        // Exactly on the lower boundary: the window is (now - 30d, now], so it is excluded
        CompleteRequest(createdAt: Now.AddDays(-40), completedAt: Now.AddDays(-30));
        // Completed without a Completed log has no known completion time
        AddRequest(ServiceRequestStatus.Completed, _worker.Id, Now.AddDays(-1));

        // Act
        var result = await _handler.Handle(new GetWorkerWorkloadQuery(), CancellationToken.None);

        // Assert
        result.Workers.Single().CompletedLast30Days.Should().Be(1);
    }

    [Fact]
    public async Task Handle_CompletedRequestWithSeveralCompletedLogs_UsesLatestLog()
    {
        // Arrange
        var request = CompleteRequest(createdAt: Now.AddDays(-60), completedAt: Now.AddDays(-40));
        AddLog(request, ServiceRequestStatus.Completed, Now.AddDays(-2));

        // Act
        var result = await _handler.Handle(new GetWorkerWorkloadQuery(), CancellationToken.None);

        // Assert
        result.Workers.Single().CompletedLast30Days.Should().Be(1);
    }

    [Fact]
    public async Task Handle_WorkersWithoutRequestsAndInactiveWorkers_AreIncludedInCreationOrder()
    {
        // Arrange
        var inactive = AddWorker(Now.AddDays(-50), isActive: false);
        var newest = AddWorker(Now.AddDays(-1));
        _data.Users.Add(new UserBuilder().WithTenantId(_tenantId).WithRole(UserRole.Admin).Build());
        _data.Users.Add(new UserBuilder().WithTenantId(_tenantId).WithRole(UserRole.Customer).Build());
        AddRequest(ServiceRequestStatus.Assigned, inactive.Id);

        // Act
        var result = await _handler.Handle(new GetWorkerWorkloadQuery(), CancellationToken.None);

        // Assert
        result.Workers.Should().Equal(
            new WorkerWorkload(_worker.Id, 0, 0, 0),
            new WorkerWorkload(inactive.Id, 1, 0, 0),
            new WorkerWorkload(newest.Id, 0, 0, 0)
        );
    }

    [Fact]
    public async Task Handle_OtherTenantData_IsExcluded()
    {
        // Arrange
        var otherTenantId = Guid.NewGuid();
        _data.Users.Add(
            new UserBuilder().WithTenantId(otherTenantId).WithRole(UserRole.Worker).Build()
        );
        _data.Requests.Add(
            new ServiceRequestBuilder()
                .WithTenantId(otherTenantId)
                .WithStatus(ServiceRequestStatus.InProgress, _worker.Id)
                .Build()
        );

        // Act
        var result = await _handler.Handle(new GetWorkerWorkloadQuery(), CancellationToken.None);

        // Assert
        result.Workers.Should().Equal(new WorkerWorkload(_worker.Id, 0, 0, 0));
    }

    [Fact]
    public async Task Handle_DeletedWorker_IsExcluded()
    {
        // Arrange
        var deleted = AddWorker(Now.AddDays(-5));
        deleted.SoftDelete();

        // Act
        var result = await _handler.Handle(new GetWorkerWorkloadQuery(), CancellationToken.None);

        // Assert
        result.Workers.Select(w => w.WorkerId).Should().Equal(_worker.Id);
    }

    private User AddWorker(DateTime createdAt, bool isActive = true)
    {
        var builder = new UserBuilder().WithTenantId(_tenantId).WithRole(UserRole.Worker);
        if (!isActive)
            builder.AsInactive();
        var worker = builder.Build().WithCreatedAt(createdAt);
        _data.Users.Add(worker);
        return worker;
    }

    private ServiceRequest AddRequest(
        ServiceRequestStatus status,
        Guid? workerId = null,
        DateTime? createdAt = null
    )
    {
        var request = new ServiceRequestBuilder()
            .WithTenantId(_tenantId)
            .WithStatus(status, workerId)
            .CreatedAt(createdAt ?? Now.AddDays(-1))
            .Build();
        _data.Requests.Add(request);
        return request;
    }

    private ServiceRequest CompleteRequest(DateTime createdAt, DateTime completedAt)
    {
        var request = AddRequest(ServiceRequestStatus.Completed, _worker.Id, createdAt);
        AddLog(request, ServiceRequestStatus.Completed, completedAt);
        return request;
    }

    private void AddLog(ServiceRequest request, ServiceRequestStatus newStatus, DateTime at)
    {
        _data.Logs.Add(
            new ServiceLog(_tenantId, request.Id, ServiceRequestStatus.InProgress, newStatus)
                .WithCreatedAt(at)
        );
    }
}
