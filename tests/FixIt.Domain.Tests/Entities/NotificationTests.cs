using FixIt.Domain.Constants;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace FixIt.Domain.Tests.Entities;

public class NotificationTests
{
    private static Notification NewNotification() =>
        new(
            Guid.NewGuid(),
            Guid.NewGuid(),
            NotificationTypes.ServiceRequestStatusChanged,
            Guid.NewGuid(),
            Guid.NewGuid(),
            ServiceRequestStatus.Assigned,
            ServiceRequestStatus.InProgress,
            Guid.NewGuid()
        );

    [Fact]
    public void Constructor_NewNotification_IsUnread()
    {
        var notification = NewNotification();

        notification.ReadAt.Should().BeNull();
        notification.IsRead.Should().BeFalse();
        notification.Type.Should().Be(NotificationTypes.ServiceRequestStatusChanged);
    }

    [Fact]
    public void Constructor_EmptyType_Throws()
    {
        var act = () => new Notification(Guid.NewGuid(), Guid.NewGuid(), " ", Guid.NewGuid());

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void MarkRead_Unread_SetsReadAt()
    {
        var notification = NewNotification();
        var readAt = new DateTime(2026, 11, 14, 10, 0, 0, DateTimeKind.Utc);

        notification.MarkRead(readAt);

        notification.ReadAt.Should().Be(readAt);
        notification.IsRead.Should().BeTrue();
    }

    [Fact]
    public void MarkRead_AlreadyRead_KeepsFirstReadTime()
    {
        var notification = NewNotification();
        var first = new DateTime(2026, 11, 14, 10, 0, 0, DateTimeKind.Utc);
        notification.MarkRead(first);

        notification.MarkRead(first.AddHours(1));

        notification.ReadAt.Should().Be(first);
    }
}
