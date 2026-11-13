using FixIt.Application.Features.Workers.UpdateWorkerProfile;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Application.Tests.Common.Builders;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.UpdateWorkerProfile;

public class UpdateWorkerProfileCommandHandlerTests
{
    private readonly Mock<IWorkerProfileRepository> _workerProfileRepositoryMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly UpdateWorkerProfileCommandHandler _handler;

    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly User _worker;

    public UpdateWorkerProfileCommandHandlerTests()
    {
        _worker = new UserBuilder().WithTenantId(_tenantId).WithRole(UserRole.Worker).Build();
        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(_worker.Id, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_worker);

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(_tenantId);
        ActAs(UserRole.Admin, Guid.NewGuid());

        _handler = new UpdateWorkerProfileCommandHandler(
            _workerProfileRepositoryMock.Object,
            _userRepositoryMock.Object,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task Handle_AdminUpdatesExistingProfile_UpdatesAndPersists()
    {
        // Arrange
        var profile = GivenExistingProfile();

        // Act
        var result = await _handler.Handle(
            new UpdateWorkerProfileCommand(_worker.Id, "Electrician", "+48 111 222 333", false),
            CancellationToken.None
        );

        // Assert
        result.Profile.Should().BeSameAs(profile);
        result.Profile.Specialization.Should().Be("Electrician");
        result.Profile.PhoneNumber.Should().Be("+48 111 222 333");
        result.Profile.IsAvailable.Should().BeFalse();
        _workerProfileRepositoryMock.Verify(
            x => x.UpdateAsync(profile, It.IsAny<CancellationToken>()),
            Times.Once
        );
        _workerProfileRepositoryMock.Verify(
            x => x.AddAsync(It.IsAny<WorkerProfile>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    [Fact]
    public async Task Handle_ProfileMissing_CreatesProfile()
    {
        // Arrange
        _workerProfileRepositoryMock
            .Setup(x => x.GetByUserIdAsync(_worker.Id, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((WorkerProfile?)null);

        // Act
        var result = await _handler.Handle(
            new UpdateWorkerProfileCommand(_worker.Id, "Plumbing", null, false),
            CancellationToken.None
        );

        // Assert
        result.Profile.TenantId.Should().Be(_tenantId);
        result.Profile.UserId.Should().Be(_worker.Id);
        result.Profile.Specialization.Should().Be("Plumbing");
        result.Profile.PhoneNumber.Should().BeNull();
        result.Profile.IsAvailable.Should().BeFalse();
        _workerProfileRepositoryMock.Verify(
            x => x.AddAsync(result.Profile, It.IsAny<CancellationToken>()),
            Times.Once
        );
        _workerProfileRepositoryMock.Verify(
            x => x.UpdateAsync(It.IsAny<WorkerProfile>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    [Fact]
    public async Task Handle_WorkerUpdatesOwnProfile_Succeeds()
    {
        // Arrange
        GivenExistingProfile();
        ActAs(UserRole.Worker, _worker.Id);

        // Act
        var result = await _handler.Handle(
            new UpdateWorkerProfileCommand(_worker.Id, "HVAC", null, true),
            CancellationToken.None
        );

        // Assert
        result.Profile.Specialization.Should().Be("HVAC");
    }

    [Fact]
    public async Task Handle_WorkerUpdatesSomeoneElse_ThrowsResourceNotFoundException()
    {
        // Arrange
        GivenExistingProfile();
        ActAs(UserRole.Worker, Guid.NewGuid());

        // Act
        var act = async () =>
            await _handler.Handle(
                new UpdateWorkerProfileCommand(_worker.Id, "HVAC", null, true),
                CancellationToken.None
            );

        // Assert
        await act.Should().ThrowAsync<ResourceNotFoundException>();
        VerifyNothingPersisted();
    }

    [Fact]
    public async Task Handle_TargetIsNotWorker_ThrowsResourceNotFoundException()
    {
        // Arrange
        var customer = new UserBuilder().WithTenantId(_tenantId).WithRole(UserRole.Customer).Build();
        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(customer.Id, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(customer);

        // Act
        var act = async () =>
            await _handler.Handle(
                new UpdateWorkerProfileCommand(customer.Id, "HVAC", null, true),
                CancellationToken.None
            );

        // Assert
        var exception = await act.Should().ThrowAsync<ResourceNotFoundException>();
        exception.Which.EntityName.Should().Be("Worker");
        VerifyNothingPersisted();
    }

    [Fact]
    public async Task Handle_TargetNotInTenant_ThrowsResourceNotFoundException()
    {
        // Arrange
        var unknownId = Guid.NewGuid();
        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(unknownId, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act
        var act = async () =>
            await _handler.Handle(
                new UpdateWorkerProfileCommand(unknownId, "HVAC", null, true),
                CancellationToken.None
            );

        // Assert
        await act.Should().ThrowAsync<ResourceNotFoundException>();
        VerifyNothingPersisted();
    }

    [Fact]
    public async Task Handle_SpecializationTooLong_ThrowsWorkerProfileSpecializationTooLongException()
    {
        // Arrange
        GivenExistingProfile();
        var specialization = new string('s', WorkerProfile.SpecializationMaxLength + 1);

        // Act
        var act = async () =>
            await _handler.Handle(
                new UpdateWorkerProfileCommand(_worker.Id, specialization, null, true),
                CancellationToken.None
            );

        // Assert
        var exception = await act.Should().ThrowAsync<WorkerProfileSpecializationTooLongException>();
        exception.Which.ErrorCode.Should().Be("WRK_001_SPECIALIZATION_TOO_LONG");
        VerifyNothingPersisted();
    }

    [Fact]
    public async Task Handle_PhoneNumberTooLong_ThrowsWorkerProfilePhoneNumberTooLongException()
    {
        // Arrange
        _workerProfileRepositoryMock
            .Setup(x => x.GetByUserIdAsync(_worker.Id, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((WorkerProfile?)null);
        var phoneNumber = new string('1', WorkerProfile.PhoneNumberMaxLength + 1);

        // Act
        var act = async () =>
            await _handler.Handle(
                new UpdateWorkerProfileCommand(_worker.Id, null, phoneNumber, true),
                CancellationToken.None
            );

        // Assert
        var exception = await act.Should().ThrowAsync<WorkerProfilePhoneNumberTooLongException>();
        exception.Which.ErrorCode.Should().Be("WRK_002_PHONE_TOO_LONG");
        VerifyNothingPersisted();
    }

    [Fact]
    public async Task Handle_ValuesAtMaxLengthAfterTrim_AreAccepted()
    {
        // Arrange
        GivenExistingProfile();
        var specialization = $"  {new string('s', WorkerProfile.SpecializationMaxLength)}  ";
        var phoneNumber = $" {new string('1', WorkerProfile.PhoneNumberMaxLength)} ";

        // Act
        var result = await _handler.Handle(
            new UpdateWorkerProfileCommand(_worker.Id, specialization, phoneNumber, true),
            CancellationToken.None
        );

        // Assert
        result.Profile.Specialization.Should().HaveLength(WorkerProfile.SpecializationMaxLength);
        result.Profile.PhoneNumber.Should().HaveLength(WorkerProfile.PhoneNumberMaxLength);
    }

    [Fact]
    public async Task Handle_PaddedAndBlankValues_TrimsAndStoresBlankAsNull()
    {
        // Arrange
        GivenExistingProfile();

        // Act
        var result = await _handler.Handle(
            new UpdateWorkerProfileCommand(_worker.Id, "  Carpentry  ", "   ", true),
            CancellationToken.None
        );

        // Assert
        result.Profile.Specialization.Should().Be("Carpentry");
        result.Profile.PhoneNumber.Should().BeNull();
        result.Profile.IsAvailable.Should().BeTrue();
    }

    private WorkerProfile GivenExistingProfile()
    {
        var profile = new WorkerProfileBuilder()
            .WithTenantId(_tenantId)
            .WithUserId(_worker.Id)
            .Build();
        _workerProfileRepositoryMock
            .Setup(x => x.GetByUserIdAsync(_worker.Id, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(profile);
        return profile;
    }

    private void ActAs(UserRole role, Guid userId)
    {
        _currentUserServiceMock.Setup(x => x.Role).Returns(role.ToString());
        _currentUserServiceMock.Setup(x => x.UserId).Returns(userId);
    }

    private void VerifyNothingPersisted()
    {
        _workerProfileRepositoryMock.Verify(
            x => x.AddAsync(It.IsAny<WorkerProfile>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
        _workerProfileRepositoryMock.Verify(
            x => x.UpdateAsync(It.IsAny<WorkerProfile>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }
}
