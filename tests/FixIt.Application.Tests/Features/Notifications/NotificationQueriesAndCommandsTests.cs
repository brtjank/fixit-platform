using FixIt.Application.Features.Notifications.GetNotifications;
using FixIt.Application.Features.Notifications.GetUnreadNotificationCount;
using FixIt.Application.Features.Notifications.MarkAllNotificationsRead;
using FixIt.Application.Features.Notifications.MarkNotificationRead;
using FixIt.Application.Interfaces.Services;
using FixIt.Application.Tests.Common.Builders;
using FixIt.Application.Tests.Common.Fakes;
using FixIt.Domain.Constants;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;

namespace FixIt.Application.Tests.Features.Notifications;

public class NotificationQueriesAndCommandsTests
{
    private static readonly DateTime Now = new(2026, 11, 14, 12, 0, 0, DateTimeKind.Utc);

    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly InMemoryTenantData _data = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly InMemoryQueryableExecutor _executor = new();
    private readonly FixedDateTimeProvider _clock = new(Now);

    private readonly User _me;
    private readonly User _actor;
    private readonly ServiceRequest _request;

    public NotificationQueriesAndCommandsTests()
    {
        _me = new UserBuilder().WithTenantId(_tenantId).WithRole(UserRole.Customer).Build();
        _actor = new UserBuilder()
            .WithTenantId(_tenantId)
            .WithName("Anna", "Wiśniewska")
            .WithRole(UserRole.Worker)
            .Build();
        _data.Users.AddRange([_me, _actor]);

        _request = new ServiceRequestBuilder()
            .WithTenantId(_tenantId)
            .WithCustomerId(_me.Id)
            .WithTitle("Boiler")
            .Build();
        _data.Requests.Add(_request);

        _currentUser.Setup(x => x.TenantId).Returns(_tenantId);
        _currentUser.Setup(x => x.UserId).Returns(_me.Id);
    }

    private Notification AddNotification(
        Guid? recipientId = null,
        Guid? tenantId = null,
        DateTime? createdAt = null,
        bool read = false,
        Guid? actorId = null
    )
    {
        var notification = new Notification(
            tenantId ?? _tenantId,
            recipientId ?? _me.Id,
            NotificationTypes.ServiceRequestStatusChanged,
            Guid.NewGuid(),
            _request.Id,
            ServiceRequestStatus.Assigned,
            ServiceRequestStatus.InProgress,
            actorId ?? _actor.Id
        ).WithCreatedAt(createdAt ?? Now.AddMinutes(-10));
        if (read)
            notification.MarkRead(Now.AddMinutes(-1));
        _data.Notifications.Add(notification);
        return notification;
    }

    private GetNotificationsQueryHandler ListHandler() =>
        new(
            _data.NotificationRepository.Object,
            _data.ServiceRequestRepository.Object,
            _data.UserRepository.Object,
            _currentUser.Object,
            _executor
        );

    private MarkNotificationReadCommandHandler MarkReadHandler() =>
        new(
            _data.NotificationRepository.Object,
            _data.ServiceRequestRepository.Object,
            _data.UserRepository.Object,
            _currentUser.Object,
            _executor,
            _clock
        );

    [Fact]
    public async Task GetNotifications_ReturnsOnlyOwnNotificationsNewestFirst()
    {
        // Arrange
        var older = AddNotification(createdAt: Now.AddHours(-2));
        var newer = AddNotification(createdAt: Now.AddHours(-1));
        AddNotification(recipientId: _actor.Id);
        AddNotification(tenantId: Guid.NewGuid());

        // Act
        var result = await ListHandler().Handle(new GetNotificationsQuery(), CancellationToken.None);

        // Assert
        result.Items.Select(i => i.Id).Should().Equal(newer.Id, older.Id);
    }

    [Fact]
    public async Task GetNotifications_MapsTitleActorAndStatuses()
    {
        AddNotification();

        var item = (await ListHandler().Handle(new GetNotificationsQuery(), CancellationToken.None))
            .Items.Single();

        item.Type.Should().Be(NotificationTypes.ServiceRequestStatusChanged);
        item.ServiceRequestId.Should().Be(_request.Id);
        item.ServiceRequestTitle.Should().Be("Boiler");
        item.ActorName.Should().Be("Anna Wiśniewska");
        item.PreviousStatus.Should().Be(ServiceRequestStatus.Assigned);
        item.NewStatus.Should().Be(ServiceRequestStatus.InProgress);
        item.ReadAt.Should().BeNull();
    }

    [Fact]
    public async Task GetNotifications_DeletedActor_ActorNameIsNull()
    {
        AddNotification();
        _actor.SoftDelete();

        var item = (await ListHandler().Handle(new GetNotificationsQuery(), CancellationToken.None))
            .Items.Single();

        item.ActorName.Should().BeNull();
    }

    [Fact]
    public async Task GetNotifications_UnreadOnly_ExcludesRead()
    {
        var unread = AddNotification();
        AddNotification(read: true);

        var result = await ListHandler()
            .Handle(new GetNotificationsQuery(UnreadOnly: true), CancellationToken.None);

        result.Items.Select(i => i.Id).Should().Equal(unread.Id);
    }

    [Theory]
    [InlineData(null, 20)]
    [InlineData(0, 1)]
    [InlineData(5, 5)]
    [InlineData(500, 100)]
    public async Task GetNotifications_Limit_IsClampedTo1To100(int? limit, int expected)
    {
        for (var i = 0; i < 120; i++)
            AddNotification(createdAt: Now.AddMinutes(-i));

        var result = await ListHandler()
            .Handle(new GetNotificationsQuery(Limit: limit), CancellationToken.None);

        result.Items.Should().HaveCount(expected);
    }

    [Fact]
    public async Task GetUnreadCount_CountsOwnUnreadOnly()
    {
        AddNotification();
        AddNotification();
        AddNotification(read: true);
        AddNotification(recipientId: _actor.Id);

        var result = await new GetUnreadNotificationCountQueryHandler(
            _data.NotificationRepository.Object,
            _currentUser.Object,
            _executor
        ).Handle(new GetUnreadNotificationCountQuery(), CancellationToken.None);

        result.Count.Should().Be(2);
    }

    [Fact]
    public async Task MarkRead_OwnNotification_SetsReadAtAndReturnsDto()
    {
        var notification = AddNotification();

        var result = await MarkReadHandler()
            .Handle(new MarkNotificationReadCommand(notification.Id), CancellationToken.None);

        result.Id.Should().Be(notification.Id);
        result.ReadAt.Should().Be(Now);
        _data.NotificationRepository.Verify(
            x => x.UpdateAsync(notification, It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    [Fact]
    public async Task MarkRead_AlreadyRead_IsIdempotent()
    {
        var notification = AddNotification(read: true);
        var originalReadAt = notification.ReadAt;

        var result = await MarkReadHandler()
            .Handle(new MarkNotificationReadCommand(notification.Id), CancellationToken.None);

        result.ReadAt.Should().Be(originalReadAt);
        _data.NotificationRepository.Verify(
            x => x.UpdateAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    [Fact]
    public async Task MarkRead_SomeoneElsesNotification_ThrowsNotFound()
    {
        var foreign = AddNotification(recipientId: _actor.Id);

        var act = () =>
            MarkReadHandler().Handle(new MarkNotificationReadCommand(foreign.Id), CancellationToken.None);

        await act.Should().ThrowAsync<ResourceNotFoundException>();
        foreign.ReadAt.Should().BeNull();
    }

    [Fact]
    public async Task MarkRead_OtherTenantsNotification_ThrowsNotFound()
    {
        var foreign = AddNotification(tenantId: Guid.NewGuid());

        var act = () =>
            MarkReadHandler().Handle(new MarkNotificationReadCommand(foreign.Id), CancellationToken.None);

        await act.Should().ThrowAsync<ResourceNotFoundException>();
    }

    [Fact]
    public async Task MarkAllRead_MarksOnlyOwnUnreadAndReturnsCount()
    {
        AddNotification();
        AddNotification();
        AddNotification(read: true);
        var foreign = AddNotification(recipientId: _actor.Id);

        var result = await new MarkAllNotificationsReadCommandHandler(
            _data.NotificationRepository.Object,
            _currentUser.Object,
            _clock
        ).Handle(new MarkAllNotificationsReadCommand(), CancellationToken.None);

        result.Updated.Should().Be(2);
        foreign.ReadAt.Should().BeNull();
        _data.NotificationRepository.Verify(
            x => x.MarkAllReadAsync(_me.Id, _tenantId, Now, It.IsAny<CancellationToken>()),
            Times.Once
        );
    }
}
