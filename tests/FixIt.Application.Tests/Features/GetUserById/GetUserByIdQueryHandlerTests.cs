using FixIt.Application.Features.Users.GetUserById;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Application.Tests.Common.Builders;
using FixIt.Domain.Entities;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.GetUserById;

public class GetUserByIdQueryHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly GetUserByIdQueryHandler _handler;
    private readonly Guid _tenantId = Guid.NewGuid();

    public GetUserByIdQueryHandlerTests()
    {
        _currentUserServiceMock.Setup(x => x.TenantId).Returns(_tenantId);
        _handler = new GetUserByIdQueryHandler(
            _userRepositoryMock.Object,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task Handle_UserInTenant_ReturnsUser()
    {
        // Arrange
        var user = new UserBuilder().WithTenantId(_tenantId).Build();
        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(user.Id, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act
        var result = await _handler.Handle(new GetUserByIdQuery(user.Id), CancellationToken.None);

        // Assert
        result.User.Should().BeSameAs(user);
    }

    [Fact]
    public async Task Handle_UserNotFound_ThrowsResourceNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(userId, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act
        var act = async () =>
            await _handler.Handle(new GetUserByIdQuery(userId), CancellationToken.None);

        // Assert
        var exception = await act.Should().ThrowAsync<ResourceNotFoundException>();
        exception.Which.EntityName.Should().Be("User");
        exception.Which.Identifier.Should().Be(userId.ToString());
    }

    [Fact]
    public async Task Handle_UserFromOtherTenant_ThrowsResourceNotFoundException()
    {
        // Arrange
        var otherTenantUser = new UserBuilder().WithTenantId(Guid.NewGuid()).Build();
        _userRepositoryMock
            .Setup(x =>
                x.GetByIdAsync(
                    otherTenantUser.Id,
                    otherTenantUser.TenantId,
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync(otherTenantUser);

        // Act
        var act = async () =>
            await _handler.Handle(
                new GetUserByIdQuery(otherTenantUser.Id),
                CancellationToken.None
            );

        // Assert
        await act.Should().ThrowAsync<ResourceNotFoundException>();
        _userRepositoryMock.Verify(
            x => x.GetByIdAsync(otherTenantUser.Id, _tenantId, It.IsAny<CancellationToken>()),
            Times.Once
        );
    }
}
