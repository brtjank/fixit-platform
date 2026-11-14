using FixIt.Application.Common;
using FixIt.Application.Common.Exceptions;
using FixIt.Application.Features.Notifications.HandleServiceRequestStatusChanged;
using FixIt.Application.Tests.Common.Builders;
using FixIt.Application.Tests.Common.Fakes;
using FixIt.Domain.Constants;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Events;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace FixIt.Application.Tests.Features.Notifications;

public class HandleServiceRequestStatusChangedCommandHandlerTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly InMemoryTenantData _data = new();
    private readonly HandleServiceRequestStatusChangedCommandHandler _handler;

    private readonly User _admin;
    private readonly User _secondAdmin;
    private readonly User _customer;
    private readonly User _worker;
    private readonly User _otherWorker;
    private readonly ServiceRequest _request;

    public HandleServiceRequestStatusChangedCommandHandlerTests()
    {
        _admin = AddUser(UserRole.Admin, "admin@x.pl");
        _secondAdmin = AddUser(UserRole.Admin, "admin2@x.pl");
        _customer = AddUser(UserRole.Customer, "customer@x.pl");
        _worker = AddUser(UserRole.Worker, "worker@x.pl");
        _otherWorker = AddUser(UserRole.Worker, "other@x.pl");

        _request = new ServiceRequestBuilder()
            .WithTenantId(_tenantId)
            .WithCustomerId(_customer.Id)
            .WithStatus(ServiceRequestStatus.InProgress, _worker.Id)
            .Build();
        _data.Requests.Add(_request);

        _handler = new HandleServiceRequestStatusChangedCommandHandler(
            _data.ServiceRequestRepository.Object,
            _data.UserRepository.Object,
            _data.NotificationRepository.Object,
            new InMemoryQueryableExecutor(),
            NullLogger<HandleServiceRequestStatusChangedCommandHandler>.Instance
        );
    }

    private User AddUser(UserRole role, string email, Guid? tenantId = null)
    {
        var user = new UserBuilder()
            .WithTenantId(tenantId ?? _tenantId)
            .WithEmail(email)
            .WithRole(role)
            .Build();
        _data.Users.Add(user);
        return user;
    }

    private ServiceRequestStatusChanged Event(Guid? actorId, Guid? requestId = null) =>
        new(
            Guid.NewGuid(),
            DateTime.UtcNow,
            _tenantId,
            requestId ?? _request.Id,
            ServiceRequestStatus.InProgress,
            ServiceRequestStatus.Completed,
            actorId
        );

    private Task<HandleServiceRequestStatusChangedResponse> Handle(ServiceRequestStatusChanged @event) =>
        _handler.Handle(new HandleServiceRequestStatusChangedCommand(@event), CancellationToken.None);

    [Fact]
    public async Task Handle_WorkerChangesStatus_NotifiesCustomerAndAdminsButNotActor()
    {
        // Arrange
        var @event = Event(_worker.Id);

        // Act
        var result = await Handle(@event);

        // Assert
        result.NotificationsCreated.Should().Be(3);
        _data
            .Notifications.Select(n => n.RecipientUserId)
            .Should()
            .BeEquivalentTo([_customer.Id, _admin.Id, _secondAdmin.Id]);
        _data.Notifications.Should().OnlyContain(n =>
            n.TenantId == _tenantId
            && n.SourceEventId == @event.EventId
            && n.Type == NotificationTypes.ServiceRequestStatusChanged
            && n.ServiceRequestId == _request.Id
            && n.PreviousStatus == ServiceRequestStatus.InProgress
            && n.NewStatus == ServiceRequestStatus.Completed
            && n.ActorUserId == _worker.Id
            && n.ReadAt == null
        );
    }

    [Fact]
    public async Task Handle_AdminChangesStatus_NotifiesCustomerWorkerAndOtherAdmins()
    {
        await Handle(Event(_admin.Id));

        _data
            .Notifications.Select(n => n.RecipientUserId)
            .Should()
            .BeEquivalentTo([_customer.Id, _worker.Id, _secondAdmin.Id]);
    }

    [Fact]
    public async Task Handle_SystemChange_NotifiesEveryoneInvolved()
    {
        await Handle(Event(actorId: null));

        _data
            .Notifications.Select(n => n.RecipientUserId)
            .Should()
            .BeEquivalentTo([_customer.Id, _worker.Id, _admin.Id, _secondAdmin.Id]);
    }

    [Fact]
    public async Task Handle_UnassignedWorkersAreNotNotified()
    {
        await Handle(Event(_admin.Id));

        _data.Notifications.Should().NotContain(n => n.RecipientUserId == _otherWorker.Id);
    }

    [Fact]
    public async Task Handle_InactiveOrDeletedUsers_AreSkipped()
    {
        // Arrange
        _secondAdmin.Deactivate();
        _customer.SoftDelete();

        // Act
        await Handle(Event(_worker.Id));

        // Assert
        _data.Notifications.Select(n => n.RecipientUserId).Should().BeEquivalentTo([_admin.Id]);
    }

    [Fact]
    public async Task Handle_AdminsOfOtherTenants_AreNotNotified()
    {
        var foreignAdmin = AddUser(UserRole.Admin, "foreign@y.pl", Guid.NewGuid());

        await Handle(Event(_worker.Id));

        _data.Notifications.Should().NotContain(n => n.RecipientUserId == foreignAdmin.Id);
    }

    [Fact]
    public async Task Handle_SameEventTwice_CreatesNotificationsOnce()
    {
        // Arrange
        var @event = Event(_worker.Id);
        await Handle(@event);

        // Act
        var second = await Handle(@event);

        // Assert
        second.NotificationsCreated.Should().Be(0);
        _data.Notifications.Should().HaveCount(3);
    }

    [Fact]
    public async Task Handle_PartiallyProcessedEvent_CreatesOnlyMissingNotifications()
    {
        // Arrange
        var @event = Event(_worker.Id);
        _data.Notifications.Add(
            new Notification(
                _tenantId,
                _customer.Id,
                NotificationTypes.ServiceRequestStatusChanged,
                @event.EventId
            )
        );

        // Act
        var result = await Handle(@event);

        // Assert
        result.NotificationsCreated.Should().Be(2);
        _data.Notifications.Should().HaveCount(3);
    }

    [Fact]
    public async Task Handle_ConcurrentDuplicateInsert_IsTreatedAsProcessed()
    {
        // Arrange
        _data
            .NotificationRepository.Setup(x =>
                x.AddRangeAsync(It.IsAny<IEnumerable<Notification>>(), It.IsAny<CancellationToken>())
            )
            .ThrowsAsync(
                new UniqueConstraintViolationException(
                    UniqueConstraints.NotificationSourceEventRecipient,
                    new Exception()
                )
            );

        // Act
        var result = await Handle(Event(_worker.Id));

        // Assert
        result.NotificationsCreated.Should().Be(0);
    }

    [Fact]
    public async Task Handle_OtherUniqueViolation_Propagates()
    {
        // Arrange
        _data
            .NotificationRepository.Setup(x =>
                x.AddRangeAsync(It.IsAny<IEnumerable<Notification>>(), It.IsAny<CancellationToken>())
            )
            .ThrowsAsync(new UniqueConstraintViolationException("IX_Other", new Exception()));

        // Act
        var act = () => Handle(Event(_worker.Id));

        // Assert
        await act.Should().ThrowAsync<UniqueConstraintViolationException>();
    }

    [Fact]
    public async Task Handle_RequestMissing_AcknowledgesWithoutNotifications()
    {
        var result = await Handle(Event(_worker.Id, requestId: Guid.NewGuid()));

        result.NotificationsCreated.Should().Be(0);
        _data.Notifications.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_EventTenantDiffersFromRequestTenant_CreatesNothing()
    {
        // Arrange: the request lookup is tenant-scoped, so a forged tenant finds nothing
        var @event = Event(_worker.Id) with { TenantId = Guid.NewGuid() };

        // Act
        await Handle(@event);

        // Assert
        _data.Notifications.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_CustomerIsAlsoAdmin_NotifiedOnce()
    {
        // Arrange: an admin who filed the request themselves appears in both recipient groups
        var request = new ServiceRequestBuilder()
            .WithTenantId(_tenantId)
            .WithCustomerId(_admin.Id)
            .Build();
        _data.Requests.Add(request);

        // Act
        await Handle(Event(actorId: null, requestId: request.Id));

        // Assert
        _data.Notifications.Count(n => n.RecipientUserId == _admin.Id).Should().Be(1);
    }
}
