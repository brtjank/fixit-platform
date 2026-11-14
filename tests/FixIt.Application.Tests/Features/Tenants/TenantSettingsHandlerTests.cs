using FixIt.Application.Features.Tenants.GetCurrentTenant;
using FixIt.Application.Features.Tenants.UpdateCurrentTenant;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Constants;
using FixIt.Domain.Entities;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.Tenants;

public class TenantSettingsHandlerTests
{
    private readonly Mock<ITenantRepository> _tenantRepositoryMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Tenant _tenant;

    public TenantSettingsHandlerTests()
    {
        _tenant = new Tenant(_tenantId, "Hydro-Serwis", "Plumbing");
        _currentUserServiceMock.Setup(x => x.TenantId).Returns(_tenantId);
        _tenantRepositoryMock
            .Setup(x => x.GetByIdAsync(_tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_tenant);
    }

    [Fact]
    public async Task GetCurrent_TenantExists_ReturnsCallersTenant()
    {
        // Arrange
        var handler = new GetCurrentTenantQueryHandler(
            _tenantRepositoryMock.Object,
            _currentUserServiceMock.Object
        );

        // Act
        var result = await handler.Handle(new GetCurrentTenantQuery(), CancellationToken.None);

        // Assert
        result.Tenant.Should().BeSameAs(_tenant);
    }

    [Fact]
    public async Task GetCurrent_TenantMissing_ThrowsResourceNotFoundException()
    {
        // Arrange
        _currentUserServiceMock.Setup(x => x.TenantId).Returns(Guid.NewGuid());
        var handler = new GetCurrentTenantQueryHandler(
            _tenantRepositoryMock.Object,
            _currentUserServiceMock.Object
        );

        // Act
        var act = () => handler.Handle(new GetCurrentTenantQuery(), CancellationToken.None);

        // Assert
        var exception = await act.Should().ThrowAsync<ResourceNotFoundException>();
        exception.Which.ErrorCode.Should().Be("RES_001_NOT_FOUND");
    }

    [Fact]
    public async Task Update_ValidCommand_NormalizesPersistsAndKeepsPlan()
    {
        // Act
        var result = await UpdateHandler()
            .Handle(
                new UpdateCurrentTenantCommand(
                    " Hydro-Serwis Nowak ",
                    "",
                    "biuro@hydro-serwis.pl",
                    " ",
                    "ul. Wodna 12",
                    "Europe/Warsaw"
                ),
                CancellationToken.None
            );

        // Assert
        result.Tenant.Should().BeSameAs(_tenant);
        _tenant.Name.Should().Be("Hydro-Serwis Nowak");
        _tenant.Description.Should().BeNull();
        _tenant.Phone.Should().BeNull();
        _tenant.ContactEmail.Should().Be("biuro@hydro-serwis.pl");
        _tenant.Plan.Should().Be(TenantPlans.Team);
        _tenantRepositoryMock.Verify(
            x => x.UpdateAsync(_tenant, It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    [Fact]
    public async Task Update_InvalidTimezone_ThrowsAndDoesNotPersist()
    {
        // Act
        var act = () =>
            UpdateHandler()
                .Handle(
                    new UpdateCurrentTenantCommand("Hydro", null, null, null, null, "Nowhere/City"),
                    CancellationToken.None
                );

        // Assert
        var exception = await act.Should().ThrowAsync<TenantTimezoneInvalidException>();
        exception.Which.ErrorCode.Should().Be("TEN_007_TIMEZONE_INVALID");
        _tenantRepositoryMock.Verify(
            x => x.UpdateAsync(It.IsAny<Tenant>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    [Fact]
    public async Task Update_TenantMissing_ThrowsResourceNotFoundException()
    {
        // Arrange
        _currentUserServiceMock.Setup(x => x.TenantId).Returns(Guid.NewGuid());

        // Act
        var act = () =>
            UpdateHandler()
                .Handle(
                    new UpdateCurrentTenantCommand("Hydro", null, null, null, null, "UTC"),
                    CancellationToken.None
                );

        // Assert
        await act.Should().ThrowAsync<ResourceNotFoundException>();
    }

    private UpdateCurrentTenantCommandHandler UpdateHandler() =>
        new(_tenantRepositoryMock.Object, _currentUserServiceMock.Object);
}
