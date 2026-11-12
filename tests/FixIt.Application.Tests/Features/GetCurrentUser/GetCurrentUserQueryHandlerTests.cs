using FixIt.Application.Features.Users.GetCurrentUser;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Application.Tests.Common.Builders;
using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.GetCurrentUser;

public class GetCurrentUserQueryHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<ITenantRepository> _tenantRepositoryMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly GetCurrentUserQueryHandler _handler;

    public GetCurrentUserQueryHandlerTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _tenantRepositoryMock = new Mock<ITenantRepository>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();
        _handler = new GetCurrentUserQueryHandler(
            _userRepositoryMock.Object,
            _tenantRepositoryMock.Object,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task Handle_UserAndTenantExist_ReturnsUserWithTenantName()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var user = new UserBuilder()
            .WithTenantId(tenantId)
            .WithEmail("admin@acme.com")
            .WithRole(UserRole.Admin)
            .Build();
        var tenant = new Tenant(tenantId, "Acme Services");

        _currentUserServiceMock.Setup(x => x.UserId).Returns(user.Id);
        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(user.Id, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _tenantRepositoryMock
            .Setup(x => x.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);

        // Act
        var result = await _handler.Handle(new GetCurrentUserQuery(), CancellationToken.None);

        // Assert
        result.Id.Should().Be(user.Id);
        result.TenantId.Should().Be(tenantId);
        result.Email.Should().Be("admin@acme.com");
        result.FirstName.Should().Be(user.FirstName);
        result.LastName.Should().Be(user.LastName);
        result.Role.Should().Be(UserRole.Admin);
        result.IsActive.Should().BeTrue();
        result.IsDeleted.Should().BeFalse();
        result.CreatedAt.Should().Be(user.CreatedAt);
        result.TenantName.Should().Be("Acme Services");
    }

    [Fact]
    public async Task Handle_UserNotFound_ThrowsResourceNotFoundException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        _currentUserServiceMock.Setup(x => x.UserId).Returns(userId);
        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(userId, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act
        var act = async () => await _handler.Handle(new GetCurrentUserQuery(), CancellationToken.None);

        // Assert
        var exception = await act.Should().ThrowAsync<ResourceNotFoundException>();
        exception.Which.EntityName.Should().Be("User");
        exception.Which.Identifier.Should().Be(userId.ToString());

        _tenantRepositoryMock.Verify(
            x => x.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    [Fact]
    public async Task Handle_TenantNotFound_ReturnsEmptyTenantName()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var user = new UserBuilder().WithTenantId(tenantId).Build();

        _currentUserServiceMock.Setup(x => x.UserId).Returns(user.Id);
        _currentUserServiceMock.Setup(x => x.TenantId).Returns(tenantId);

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(user.Id, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _tenantRepositoryMock
            .Setup(x => x.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Tenant?)null);

        // Act
        var result = await _handler.Handle(new GetCurrentUserQuery(), CancellationToken.None);

        // Assert
        result.Id.Should().Be(user.Id);
        result.TenantName.Should().BeEmpty();
    }
}
