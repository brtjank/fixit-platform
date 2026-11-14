using FixIt.Application.Common;
using FixIt.Application.Common.Exceptions;
using FixIt.Application.Features.Users.CreateUser;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Application.Tests.Common.Fakes;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.CreateUser;

public class CreateUserCommandHandlerTests
{
    private const string Password = "Demo123!";

    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IWorkerProfileRepository> _workerProfileRepositoryMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly CreateUserCommandHandler _handler;

    private readonly Guid _tenantId = Guid.NewGuid();

    public CreateUserCommandHandlerTests()
    {
        _currentUserServiceMock.Setup(x => x.TenantId).Returns(_tenantId);
        _currentUserServiceMock.Setup(x => x.UserId).Returns(Guid.NewGuid());
        _userRepositoryMock
            .Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User u, CancellationToken _) => u);

        _handler = new CreateUserCommandHandler(
            _userRepositoryMock.Object,
            _workerProfileRepositoryMock.Object,
            PasswordHasherMock.Create().Object,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task Handle_ValidCustomer_CreatesActiveUserWithHashedPasswordInCallerTenant()
    {
        // Act
        var result = await _handler.Handle(
            Command("  new.customer@example.com ", UserRole.Customer),
            CancellationToken.None
        );

        // Assert
        result.User.TenantId.Should().Be(_tenantId);
        result.User.Email.Should().Be("new.customer@example.com");
        result.User.Role.Should().Be(UserRole.Customer);
        result.User.IsActive.Should().BeTrue();
        result.User.PasswordHash.Should().Be(PasswordHasherMock.HashOf(Password));
        _userRepositoryMock.Verify(
            x => x.AddAsync(result.User, It.IsAny<CancellationToken>()),
            Times.Once
        );
        _workerProfileRepositoryMock.Verify(
            x => x.AddAsync(It.IsAny<WorkerProfile>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    [Fact]
    public async Task Handle_Worker_CreatesAvailableEmptyWorkerProfile()
    {
        // Act
        var result = await _handler.Handle(
            Command("worker@example.com", UserRole.Worker),
            CancellationToken.None
        );

        // Assert
        _workerProfileRepositoryMock.Verify(
            x =>
                x.AddAsync(
                    It.Is<WorkerProfile>(p =>
                        p.UserId == result.User.Id
                        && p.TenantId == _tenantId
                        && p.IsAvailable
                        && p.Specialization == null
                        && p.PhoneNumber == null
                    ),
                    It.IsAny<CancellationToken>()
                ),
            Times.Once
        );
    }

    [Fact]
    public async Task Handle_EmailTaken_ThrowsUserEmailTakenException()
    {
        // Arrange: the repository contract is case-insensitive; the handler passes the trimmed email
        _userRepositoryMock
            .Setup(x => x.EmailExistsAsync("Taken@Example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var act = async () =>
            await _handler.Handle(
                Command(" Taken@Example.com ", UserRole.Customer),
                CancellationToken.None
            );

        // Assert
        var exception = await act.Should().ThrowAsync<UserEmailTakenException>();
        exception.Which.ErrorCode.Should().Be("USR_005_EMAIL_TAKEN");
        exception.Which.Message.Should().Be("A user with email 'Taken@Example.com' already exists.");
        VerifyNothingPersisted();
    }

    [Theory]
    [InlineData("short")]
    [InlineData("")]
    public async Task Handle_WeakPassword_ThrowsUserPasswordTooWeakException(string password)
    {
        // Act
        var act = async () =>
            await _handler.Handle(
                Command("user@example.com", UserRole.Customer, password),
                CancellationToken.None
            );

        // Assert
        var exception = await act.Should().ThrowAsync<UserPasswordTooWeakException>();
        exception.Which.ErrorCode.Should().Be("USR_007_PASSWORD_TOO_WEAK");
        exception.Which.Message.Should().Be("Password must be between 8 and 128 characters.");
        VerifyNothingPersisted();
    }

    [Fact]
    public async Task Handle_UndefinedRoleValue_ThrowsUserRoleInvalidException()
    {
        // Act
        var act = async () =>
            await _handler.Handle(Command("user@example.com", (UserRole)7), CancellationToken.None);

        // Assert
        var exception = await act.Should().ThrowAsync<UserRoleInvalidException>();
        exception.Which.ErrorCode.Should().Be("USR_004_ROLE_INVALID");
        VerifyNothingPersisted();
    }

    [Fact]
    public async Task Handle_BlankEmail_ThrowsUserEmailRequiredException()
    {
        // Act
        var act = async () =>
            await _handler.Handle(Command("   ", UserRole.Customer), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UserEmailRequiredException>();
        VerifyNothingPersisted();
    }

    [Fact]
    public async Task Handle_ConcurrentCreateHitsEmailIndex_ThrowsUserEmailTakenException()
    {
        // Arrange: the pre-check passed, but another request inserted the same email first
        _userRepositoryMock
            .Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(
                new UniqueConstraintViolationException(UniqueConstraints.UserEmail, new Exception())
            );

        // Act
        var act = async () =>
            await _handler.Handle(
                Command("Race@Example.com", UserRole.Worker),
                CancellationToken.None
            );

        // Assert
        var exception = await act.Should().ThrowAsync<UserEmailTakenException>();
        exception.Which.ErrorCode.Should().Be("USR_005_EMAIL_TAKEN");
        _workerProfileRepositoryMock.Verify(
            x => x.AddAsync(It.IsAny<WorkerProfile>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    [Fact]
    public async Task Handle_UnknownUniqueViolation_Rethrows()
    {
        // Arrange
        _userRepositoryMock
            .Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new UniqueConstraintViolationException("IX_Other", new Exception()));

        // Act
        var act = async () =>
            await _handler.Handle(
                Command("user@example.com", UserRole.Customer),
                CancellationToken.None
            );

        // Assert
        var exception = await act.Should().ThrowAsync<UniqueConstraintViolationException>();
        exception.Which.ConstraintName.Should().Be("IX_Other");
    }

    private static CreateUserCommand Command(string email, UserRole role, string password = Password) =>
        new(email, "Jan", "Kowalski", role, password);

    private void VerifyNothingPersisted()
    {
        _userRepositoryMock.Verify(
            x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
        _workerProfileRepositoryMock.Verify(
            x => x.AddAsync(It.IsAny<WorkerProfile>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }
}
