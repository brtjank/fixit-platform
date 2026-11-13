using FixIt.Application.Features.Users.ActivateUser;
using FixIt.Application.Features.Users.DeactivateUser;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Application.Tests.Common.Builders;
using FixIt.Domain.Entities;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.ActivateDeactivateUser;

public class ActivateDeactivateUserCommandHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly ActivateUserCommandHandler _activateHandler;
    private readonly DeactivateUserCommandHandler _deactivateHandler;

    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Guid _adminId = Guid.NewGuid();

    public ActivateDeactivateUserCommandHandlerTests()
    {
        _currentUserServiceMock.Setup(x => x.TenantId).Returns(_tenantId);
        _currentUserServiceMock.Setup(x => x.UserId).Returns(_adminId);

        _activateHandler = new ActivateUserCommandHandler(
            _userRepositoryMock.Object,
            _currentUserServiceMock.Object
        );
        _deactivateHandler = new DeactivateUserCommandHandler(
            _userRepositoryMock.Object,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task Deactivate_ActiveUser_DeactivatesAndPersists()
    {
        // Arrange
        var user = GivenUser(new UserBuilder());

        // Act
        var result = await _deactivateHandler.Handle(
            new DeactivateUserCommand(user.Id),
            CancellationToken.None
        );

        // Assert
        result.User.IsActive.Should().BeFalse();
        _userRepositoryMock.Verify(x => x.UpdateAsync(user, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Deactivate_AlreadyInactive_IsNoOp()
    {
        // Arrange
        var user = GivenUser(new UserBuilder().AsInactive());

        // Act
        var result = await _deactivateHandler.Handle(
            new DeactivateUserCommand(user.Id),
            CancellationToken.None
        );

        // Assert
        result.User.IsActive.Should().BeFalse();
        VerifyNotUpdated();
    }

    [Fact]
    public async Task Deactivate_Self_ThrowsUserSelfDeactivateException()
    {
        // Act
        var act = async () =>
            await _deactivateHandler.Handle(
                new DeactivateUserCommand(_adminId),
                CancellationToken.None
            );

        // Assert
        var exception = await act.Should().ThrowAsync<UserSelfDeactivateException>();
        exception.Which.ErrorCode.Should().Be("USR_006_SELF_DEACTIVATE");
        VerifyNotUpdated();
    }

    [Fact]
    public async Task Deactivate_UserInOtherTenant_ThrowsResourceNotFoundException()
    {
        // Act
        var act = async () =>
            await _deactivateHandler.Handle(
                new DeactivateUserCommand(Guid.NewGuid()),
                CancellationToken.None
            );

        // Assert
        await act.Should().ThrowAsync<ResourceNotFoundException>();
        VerifyNotUpdated();
    }

    [Fact]
    public async Task Activate_InactiveUser_ActivatesAndPersists()
    {
        // Arrange
        var user = GivenUser(new UserBuilder().AsInactive());

        // Act
        var result = await _activateHandler.Handle(
            new ActivateUserCommand(user.Id),
            CancellationToken.None
        );

        // Assert
        result.User.IsActive.Should().BeTrue();
        _userRepositoryMock.Verify(x => x.UpdateAsync(user, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Activate_AlreadyActive_IsNoOp()
    {
        // Arrange
        var user = GivenUser(new UserBuilder());

        // Act
        var result = await _activateHandler.Handle(
            new ActivateUserCommand(user.Id),
            CancellationToken.None
        );

        // Assert
        result.User.IsActive.Should().BeTrue();
        VerifyNotUpdated();
    }

    [Fact]
    public async Task Activate_UserInOtherTenant_ThrowsResourceNotFoundException()
    {
        // Act
        var act = async () =>
            await _activateHandler.Handle(
                new ActivateUserCommand(Guid.NewGuid()),
                CancellationToken.None
            );

        // Assert
        await act.Should().ThrowAsync<ResourceNotFoundException>();
        VerifyNotUpdated();
    }

    [Fact]
    public async Task Activate_SoftDeletedUser_ThrowsUserCannotBeActivatedException()
    {
        // Arrange
        var user = new UserBuilder().WithTenantId(_tenantId).Build();
        user.SoftDelete();
        GivenExisting(user);

        // Act
        var act = async () =>
            await _activateHandler.Handle(
                new ActivateUserCommand(user.Id),
                CancellationToken.None
            );

        // Assert
        var exception = await act.Should().ThrowAsync<UserCannotBeActivatedException>();
        exception.Which.ErrorCode.Should().Be("USR_003_CANNOT_ACTIVATE");
        VerifyNotUpdated();
    }

    private User GivenUser(UserBuilder builder)
    {
        var user = builder.WithTenantId(_tenantId).Build();
        GivenExisting(user);
        return user;
    }

    private void GivenExisting(User user) =>
        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(user.Id, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

    private void VerifyNotUpdated() =>
        _userRepositoryMock.Verify(
            x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
}
