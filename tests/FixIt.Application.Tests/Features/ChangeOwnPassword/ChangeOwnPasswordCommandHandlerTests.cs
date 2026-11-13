using FixIt.Application.Features.Users.ChangeOwnPassword;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Application.Tests.Common.Builders;
using FixIt.Application.Tests.Common.Fakes;
using FixIt.Domain.Entities;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.ChangeOwnPassword;

public class ChangeOwnPasswordCommandHandlerTests
{
    private const string CurrentPassword = "Demo123!";
    private const string NewPassword = "N3w-Secret";

    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly ChangeOwnPasswordCommandHandler _handler;

    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly User _user;

    public ChangeOwnPasswordCommandHandlerTests()
    {
        _user = new UserBuilder()
            .WithTenantId(_tenantId)
            .WithPasswordHash(PasswordHasherMock.HashOf(CurrentPassword))
            .Build();
        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(_user.Id, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_user);

        _currentUserServiceMock.Setup(x => x.TenantId).Returns(_tenantId);
        _currentUserServiceMock.Setup(x => x.UserId).Returns(_user.Id);

        _handler = new ChangeOwnPasswordCommandHandler(
            _userRepositoryMock.Object,
            PasswordHasherMock.Create().Object,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task Handle_CorrectCurrentPassword_StoresNewHash()
    {
        // Act
        await _handler.Handle(
            new ChangeOwnPasswordCommand(CurrentPassword, NewPassword),
            CancellationToken.None
        );

        // Assert
        _user.PasswordHash.Should().Be(PasswordHasherMock.HashOf(NewPassword));
        _userRepositoryMock.Verify(x => x.UpdateAsync(_user, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WrongCurrentPassword_ThrowsUserPasswordMismatchException()
    {
        // Act
        var act = async () =>
            await _handler.Handle(
                new ChangeOwnPasswordCommand("Wrong123!", NewPassword),
                CancellationToken.None
            );

        // Assert
        var exception = await act.Should().ThrowAsync<UserPasswordMismatchException>();
        exception.Which.ErrorCode.Should().Be("USR_008_PASSWORD_MISMATCH");
        exception.Which.Message.Should().Be("Current password is incorrect.");
        AssertUnchanged();
    }

    [Fact]
    public async Task Handle_WeakNewPassword_ThrowsUserPasswordTooWeakException()
    {
        // Act
        var act = async () =>
            await _handler.Handle(
                new ChangeOwnPasswordCommand(CurrentPassword, "short"),
                CancellationToken.None
            );

        // Assert
        var exception = await act.Should().ThrowAsync<UserPasswordTooWeakException>();
        exception.Which.ErrorCode.Should().Be("USR_007_PASSWORD_TOO_WEAK");
        AssertUnchanged();
    }

    private void AssertUnchanged()
    {
        _user.PasswordHash.Should().Be(PasswordHasherMock.HashOf(CurrentPassword));
        _userRepositoryMock.Verify(
            x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }
}
