using FixIt.Application.Features.Workers.GetWorkerProfiles;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Application.Tests.Common.Builders;
using FixIt.Domain.Entities;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.GetWorkerProfiles;

public class GetWorkerProfilesQueryHandlerTests
{
    private readonly Mock<IWorkerProfileRepository> _workerProfileRepositoryMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IQueryableExecutor> _queryableExecutorMock = new();
    private readonly GetWorkerProfilesQueryHandler _handler;
    private readonly Guid _tenantId = Guid.NewGuid();

    public GetWorkerProfilesQueryHandlerTests()
    {
        _queryableExecutorMock
            .Setup(x =>
                x.ToListAsync(It.IsAny<IQueryable<WorkerProfile>>(), It.IsAny<CancellationToken>())
            )
            .ReturnsAsync((IQueryable<WorkerProfile> q, CancellationToken _) => q.ToList());
        _currentUserServiceMock.Setup(x => x.TenantId).Returns(_tenantId);
        _handler = new GetWorkerProfilesQueryHandler(
            _workerProfileRepositoryMock.Object,
            _currentUserServiceMock.Object,
            _queryableExecutorMock.Object
        );
    }

    [Fact]
    public async Task Handle_ProfilesExist_ReturnsThemOrderedByCreatedAt()
    {
        // Arrange
        var older = new WorkerProfileBuilder().WithTenantId(_tenantId).Build();
        var newer = new WorkerProfileBuilder().WithTenantId(_tenantId).Build();
        typeof(BaseEntity)
            .GetProperty(nameof(BaseEntity.CreatedAt))!
            .SetValue(older, newer.CreatedAt.AddMinutes(-5));
        _workerProfileRepositoryMock
            .Setup(x => x.GetByTenantId(_tenantId))
            .Returns(new List<WorkerProfile> { newer, older }.AsQueryable());

        // Act
        var result = await _handler.Handle(new GetWorkerProfilesQuery(), CancellationToken.None);

        // Assert
        result.Profiles.Should().ContainInOrder(older, newer);
    }

    [Fact]
    public async Task Handle_NoProfiles_ReturnsEmptyCollection()
    {
        // Arrange
        _workerProfileRepositoryMock
            .Setup(x => x.GetByTenantId(_tenantId))
            .Returns(new List<WorkerProfile>().AsQueryable());

        // Act
        var result = await _handler.Handle(new GetWorkerProfilesQuery(), CancellationToken.None);

        // Assert
        result.Profiles.Should().BeEmpty();
    }
}
