using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Events;
using FluentAssertions;
using Xunit;

namespace FixIt.Domain.Tests.Entities;

public class ServiceRequestDomainEventsTests
{
    private static ServiceRequest NewRequest(Guid? tenantId = null) =>
        new(tenantId ?? Guid.NewGuid(), "Fix sink", "Leaking sink", Guid.NewGuid());

    [Fact]
    public void Constructor_NewRequest_RaisesNoEvents()
    {
        NewRequest().DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public void AssignWorker_PendingRequest_RaisesStatusChangedPendingToAssigned()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var actorId = Guid.NewGuid();
        var request = NewRequest(tenantId);

        // Act
        request.AssignWorker(Guid.NewGuid(), actorId);

        // Assert
        var @event = request
            .DomainEvents.Should()
            .ContainSingle()
            .Which.Should()
            .BeOfType<ServiceRequestStatusChanged>()
            .Subject;
        @event.TenantId.Should().Be(tenantId);
        @event.ServiceRequestId.Should().Be(request.Id);
        @event.PreviousStatus.Should().Be(ServiceRequestStatus.Pending);
        @event.NewStatus.Should().Be(ServiceRequestStatus.Assigned);
        @event.ChangedByUserId.Should().Be(actorId);
        @event.EventId.Should().NotBeEmpty();
        @event.OccurredAt.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Fact]
    public void ChangeStatus_DifferentStatus_RaisesEventWithPreviousAndNewStatus()
    {
        // Arrange
        var actorId = Guid.NewGuid();
        var request = NewRequest();
        request.AssignWorker(Guid.NewGuid());
        request.ClearDomainEvents();

        // Act
        request.ChangeStatus(ServiceRequestStatus.InProgress, actorId);

        // Assert
        var @event = request
            .DomainEvents.Should()
            .ContainSingle()
            .Which.Should()
            .BeOfType<ServiceRequestStatusChanged>()
            .Subject;
        @event.PreviousStatus.Should().Be(ServiceRequestStatus.Assigned);
        @event.NewStatus.Should().Be(ServiceRequestStatus.InProgress);
        @event.ChangedByUserId.Should().Be(actorId);
    }

    [Fact]
    public void ChangeStatus_SameStatus_RaisesNoEvent()
    {
        // Arrange
        var request = NewRequest();
        request.AssignWorker(Guid.NewGuid());
        request.ClearDomainEvents();

        // Act
        request.ChangeStatus(ServiceRequestStatus.Assigned);

        // Assert
        request.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public void ChangeStatus_WithoutActor_RaisesEventWithNullActor()
    {
        var request = NewRequest();

        request.ChangeStatus(ServiceRequestStatus.Cancelled);

        request
            .DomainEvents.OfType<ServiceRequestStatusChanged>()
            .Single()
            .ChangedByUserId.Should()
            .BeNull();
    }

    [Fact]
    public void ChangeStatus_InvalidTransition_RaisesNoEvent()
    {
        // Arrange
        var request = NewRequest();

        // Act
        var act = () => request.ChangeStatus(ServiceRequestStatus.InProgress);

        // Assert
        act.Should().Throw<Exception>();
        request.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public void MultipleChanges_EachRaisesEventWithDistinctId()
    {
        // Arrange
        var request = NewRequest();

        // Act
        request.AssignWorker(Guid.NewGuid());
        request.ChangeStatus(ServiceRequestStatus.InProgress);
        request.ChangeStatus(ServiceRequestStatus.Completed);

        // Assert
        request.DomainEvents.Should().HaveCount(3);
        request.DomainEvents.Select(e => e.EventId).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public void ClearDomainEvents_RemovesAllEvents()
    {
        var request = NewRequest();
        request.AssignWorker(Guid.NewGuid());

        request.ClearDomainEvents();

        request.DomainEvents.Should().BeEmpty();
    }
}
