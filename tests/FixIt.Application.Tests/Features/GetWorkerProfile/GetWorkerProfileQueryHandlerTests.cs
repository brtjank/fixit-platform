using FixIt.Application.Features.Workers.GetWorkerProfile;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Application.Tests.Common.Builders;
using FixIt.Domain.Entities;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.GetWorkerProfile;

public class GetWorkerProfileQueryHandlerTests
{
    private readonly Mock<IWorkerProfileRepository> _workerProfileRepositoryMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly GetWorkerProfileQueryHandler _handler;
    private readonly Guid _tenantId = Guid.NewGuid();

    public GetWorkerProfileQueryHandlerTests()
    {
        _currentUserServiceMock.Setup(x => x.TenantId).Returns(_tenantId);
        _handler = new GetWorkerProfileQueryHandler(
            _workerProfileRepositoryMock.Object,
            _currentUserServiceMock.Object
        );
    }

    [Fact]
    public async Task Handle_ProfileExists_ReturnsProfile()
    {
        // Arrange
        var profile = new WorkerProfileBuilder().WithTenantId(_tenantId).Build();
        _workerProfileRepositoryMock
            .Setup(x =>
                x.GetByUserIdAsync(profile.UserId, _tenantId, It.IsAny<CancellationToken>())
            )
            .ReturnsAsync(profile);

        // Act
        var result = await _handler.Handle(
            new GetWorkerProfileQuery(profile.UserId),
            CancellationToken.None
        );

        // Assert
        result.Profile.Should().BeSameAs(profile);
    }

    [Fact]
    public async Task Handle_ProfileNotFound_ThrowsResourceNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _workerProfileRepositoryMock
            .Setup(x => x.GetByUserIdAsync(userId, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((WorkerProfile?)null);

        // Act
        var act = async () =>
            await _handler.Handle(new GetWorkerProfileQuery(userId), CancellationToken.None);

        // Assert
        var exception = await act.Should().ThrowAsync<ResourceNotFoundException>();
        exception.Which.EntityName.Should().Be("WorkerProfile");
        exception.Which.Identifier.Should().Be(userId.ToString());
    }
}
