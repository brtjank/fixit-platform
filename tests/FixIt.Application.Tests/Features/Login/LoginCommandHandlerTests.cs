using FixIt.Application.Features.Auth.Login;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Application.Tests.Common.Builders;
using FixIt.Application.Tests.Common.Fakes;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.Login;

public class LoginCommandHandlerTests
{
    private const string Email = "marta@example.com";
    private const string Password = "Demo123!";

    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IJwtTokenService> _jwtTokenServiceMock = new();
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _jwtTokenServiceMock.Setup(x => x.GenerateToken(It.IsAny<User>())).Returns("jwt-token");
        _handler = new LoginCommandHandler(
            _userRepositoryMock.Object,
            _jwtTokenServiceMock.Object,
            PasswordHasherMock.Create().Object
        );
    }

    [Fact]
    public async Task Handle_CorrectPassword_ReturnsToken()
    {
        // Arrange
        var user = GivenUser(new UserBuilder().WithRole(UserRole.Admin).WithPasswordHash(PasswordHasherMock.HashOf(Password)));

        // Act
        var result = await _handler.Handle(new LoginCommand(Email, Password), CancellationToken.None);

        // Assert
        result.Token.Should().Be("jwt-token");
        result.UserId.Should().Be(user.Id);
        result.TenantId.Should().Be(user.TenantId);
        result.Role.Should().Be("Admin");
    }

    [Fact]
    public async Task Handle_WrongPassword_ThrowsUserNotAuthenticatedException()
    {
        // Arrange
        GivenUser(new UserBuilder().WithPasswordHash(PasswordHasherMock.HashOf(Password)));

        // Act & Assert
        await AssertNotAuthenticated(new LoginCommand(Email, "Wrong123!"));
    }

    [Fact]
    public async Task Handle_UserWithoutPasswordHash_ThrowsUserNotAuthenticatedException()
    {
        // Arrange
        GivenUser(new UserBuilder());

        // Act & Assert
        await AssertNotAuthenticated(new LoginCommand(Email, Password));
    }

    [Fact]
    public async Task Handle_InactiveUser_ThrowsUserNotAuthenticatedException()
    {
        // Arrange
        GivenUser(new UserBuilder().WithPasswordHash(PasswordHasherMock.HashOf(Password)).AsInactive());

        // Act & Assert
        await AssertNotAuthenticated(new LoginCommand(Email, Password));
    }

    [Fact]
    public async Task Handle_UnknownEmail_ThrowsUserNotAuthenticatedException()
    {
        // Arrange
        _userRepositoryMock
            .Setup(x => x.GetByEmailAsync(Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act & Assert
        await AssertNotAuthenticated(new LoginCommand(Email, Password));
    }

    private User GivenUser(UserBuilder builder)
    {
        var user = builder.WithEmail(Email).Build();
        _userRepositoryMock
            .Setup(x => x.GetByEmailAsync(Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        return user;
    }

    private async Task AssertNotAuthenticated(LoginCommand command)
    {
        var act = async () => await _handler.Handle(command, CancellationToken.None);

        var exception = await act.Should().ThrowAsync<UserNotAuthenticatedException>();
        exception.Which.ErrorCode.Should().Be("AUTH_001_NOT_AUTHENTICATED");
        _jwtTokenServiceMock.Verify(x => x.GenerateToken(It.IsAny<User>()), Times.Never);
    }
}
