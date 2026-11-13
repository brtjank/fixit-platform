using FixIt.Application.Features.Users.UpdateUser;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Application.Tests.Common.Builders;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.UpdateUser;

public class UpdateUserCommandHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IWorkerProfileRepository> _workerProfileRepositoryMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly UpdateUserCommandHandler _handler;

    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly User _admin;
    private readonly User _target;

    public UpdateUserCommandHandlerTests()
    {
        _admin = GivenUserInTenant(UserRole.Admin);
        _target = GivenUserInTenant(UserRole.Customer);

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(_tenantId);
        _currentUserServiceMock.Setup(x => x.UserId).Returns(_admin.Id);

        _handler = new UpdateUserCommandHandler(
            _userRepositoryMock.Object,
            _workerProfileRepositoryMock.Object,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task Handle_ValidUpdate_ReplacesNameAndRoleAndPersists()
    {
        // Act
        var result = await _handler.Handle(
            new UpdateUserCommand(_target.Id, "Ewa", "Nowak", UserRole.Admin),
            CancellationToken.None
        );

        // Assert
        result.User.Should().BeSameAs(_target);
        result.User.FirstName.Should().Be("Ewa");
        result.User.LastName.Should().Be("Nowak");
        result.User.Role.Should().Be(UserRole.Admin);
        _userRepositoryMock.Verify(
            x => x.UpdateAsync(_target, It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    [Fact]
    public async Task Handle_PromotedToWorkerWithoutProfile_CreatesWorkerProfile()
    {
        // Arrange
        _workerProfileRepositoryMock
            .Setup(x => x.GetByUserIdAsync(_target.Id, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((WorkerProfile?)null);

        // Act
        await _handler.Handle(
            new UpdateUserCommand(_target.Id, "Ewa", "Nowak", UserRole.Worker),
            CancellationToken.None
        );

        // Assert
        _workerProfileRepositoryMock.Verify(
            x =>
                x.AddAsync(
                    It.Is<WorkerProfile>(p => p.UserId == _target.Id && p.TenantId == _tenantId),
                    It.IsAny<CancellationToken>()
                ),
            Times.Once
        );
    }

    [Fact]
    public async Task Handle_UserInOtherTenant_ThrowsResourceNotFoundException()
    {
        // Arrange
        var foreignId = Guid.NewGuid();
        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(foreignId, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act
        var act = async () =>
            await _handler.Handle(
                new UpdateUserCommand(foreignId, "Ewa", "Nowak", UserRole.Customer),
                CancellationToken.None
            );

        // Assert
        var exception = await act.Should().ThrowAsync<ResourceNotFoundException>();
        exception.Which.EntityName.Should().Be("User");
        VerifyNotUpdated();
    }

    [Fact]
    public async Task Handle_AdminChangesOwnRole_ThrowsUserSelfRoleChangeException()
    {
        // Act
        var act = async () =>
            await _handler.Handle(
                new UpdateUserCommand(_admin.Id, "Marta", "Nowak", UserRole.Worker),
                CancellationToken.None
            );

        // Assert
        var exception = await act.Should().ThrowAsync<UserSelfRoleChangeException>();
        exception.Which.ErrorCode.Should().Be("USR_009_SELF_ROLE_CHANGE");
        _admin.Role.Should().Be(UserRole.Admin);
        VerifyNotUpdated();
    }

    [Fact]
    public async Task Handle_AdminUpdatesOwnNameKeepingRole_Succeeds()
    {
        // Act
        var result = await _handler.Handle(
            new UpdateUserCommand(_admin.Id, "Marta", "Kowalska", UserRole.Admin),
            CancellationToken.None
        );

        // Assert
        result.User.LastName.Should().Be("Kowalska");
        result.User.Role.Should().Be(UserRole.Admin);
    }

    [Fact]
    public async Task Handle_BlankName_ThrowsUserNameRequiredException()
    {
        // Act
        var act = async () =>
            await _handler.Handle(
                new UpdateUserCommand(_target.Id, " ", "Nowak", UserRole.Customer),
                CancellationToken.None
            );

        // Assert
        await act.Should().ThrowAsync<UserNameRequiredException>();
        VerifyNotUpdated();
    }

    private User GivenUserInTenant(UserRole role)
    {
        var user = new UserBuilder().WithTenantId(_tenantId).WithRole(role).Build();
        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(user.Id, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        return user;
    }

    private void VerifyNotUpdated() =>
        _userRepositoryMock.Verify(
            x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
}
