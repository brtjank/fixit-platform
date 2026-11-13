using FixIt.Application.Features.Users.ResetUserPassword;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Application.Tests.Common.Builders;
using FixIt.Application.Tests.Common.Fakes;
using FixIt.Domain.Entities;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.ResetUserPassword;

public class ResetUserPasswordCommandHandlerTests
{
    private const string NewPassword = "Reset-Pass1";

    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly ResetUserPasswordCommandHandler _handler;

    private readonly Guid _tenantId = Guid.NewGuid();

    public ResetUserPasswordCommandHandlerTests()
    {
        _currentUserServiceMock.Setup(x => x.TenantId).Returns(_tenantId);
        _currentUserServiceMock.Setup(x => x.UserId).Returns(Guid.NewGuid());

        _handler = new ResetUserPasswordCommandHandler(
            _userRepositoryMock.Object,
            PasswordHasherMock.Create().Object,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task Handle_UserWithoutPassword_SetsHashAndPersists()
    {
        // Arrange
        var user = new UserBuilder().WithTenantId(_tenantId).Build();
        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(user.Id, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act
        await _handler.Handle(new ResetUserPasswordCommand(user.Id, NewPassword), CancellationToken.None);

        // Assert
        user.PasswordHash.Should().Be(PasswordHasherMock.HashOf(NewPassword));
        _userRepositoryMock.Verify(x => x.UpdateAsync(user, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_UserInOtherTenant_ThrowsResourceNotFoundException()
    {
        // Act
        var act = async () =>
            await _handler.Handle(
                new ResetUserPasswordCommand(Guid.NewGuid(), NewPassword),
                CancellationToken.None
            );

        // Assert
        var exception = await act.Should().ThrowAsync<ResourceNotFoundException>();
        exception.Which.EntityName.Should().Be("User");
        _userRepositoryMock.Verify(
            x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    [Fact]
    public async Task Handle_WeakPassword_ThrowsUserPasswordTooWeakException()
    {
        // Arrange
        var user = new UserBuilder().WithTenantId(_tenantId).Build();
        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(user.Id, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act
        var act = async () =>
            await _handler.Handle(
                new ResetUserPasswordCommand(user.Id, new string('x', 129)),
                CancellationToken.None
            );

        // Assert
        await act.Should().ThrowAsync<UserPasswordTooWeakException>();
        user.PasswordHash.Should().BeNull();
    }
}
