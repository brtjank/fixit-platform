using System.Text.Json;
using FixIt.Application.Features.Users.GetMyNotificationPreferences;
using FixIt.Application.Features.Users.UpdateMyNotificationPreferences;
using FixIt.Application.Interfaces.Repositories;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Entities;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.NotificationPreferences;

public class NotificationPreferencesHandlerTests
{
    private static readonly NotificationPreferencesResponse Defaults = new(true, true, true, false);

    private readonly Mock<IUserNotificationPreferencesRepository> _repositoryMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Guid _userId = Guid.NewGuid();

    public NotificationPreferencesHandlerTests()
    {
        _currentUserServiceMock.Setup(x => x.TenantId).Returns(_tenantId);
        _currentUserServiceMock.Setup(x => x.UserId).Returns(_userId);
    }

    [Fact]
    public async Task Get_NoRow_ReturnsDefaults()
    {
        // Arrange
        GivenStored(null);

        // Act
        var result = await GetHandler().Handle(new GetMyNotificationPreferencesQuery(), CancellationToken.None);

        // Assert
        result.Should().Be(Defaults);
    }

    [Fact]
    public async Task Get_RowExists_ReturnsStoredValues()
    {
        // Arrange
        var stored = new UserNotificationPreferences(_tenantId, _userId);
        stored.Update(false, true, false, true);
        GivenStored(stored);

        // Act
        var result = await GetHandler().Handle(new GetMyNotificationPreferencesQuery(), CancellationToken.None);

        // Assert
        result.Should().Be(new NotificationPreferencesResponse(false, true, false, true));
    }

    [Fact]
    public async Task Update_NoRow_CreatesRowForCaller()
    {
        // Arrange
        GivenStored(null);
        UserNotificationPreferences? added = null;
        _repositoryMock
            .Setup(x => x.AddAsync(It.IsAny<UserNotificationPreferences>(), It.IsAny<CancellationToken>()))
            .Callback((UserNotificationPreferences p, CancellationToken _) => added = p)
            .ReturnsAsync((UserNotificationPreferences p, CancellationToken _) => p);

        // Act
        var result = await UpdateHandler()
            .Handle(new UpdateMyNotificationPreferencesCommand(false, false, true, true), CancellationToken.None);

        // Assert
        result.Should().Be(new NotificationPreferencesResponse(false, false, true, true));
        added.Should().NotBeNull();
        added!.TenantId.Should().Be(_tenantId);
        added.UserId.Should().Be(_userId);
        added.DailyDigest.Should().BeTrue();
        _repositoryMock.Verify(
            x => x.UpdateAsync(It.IsAny<UserNotificationPreferences>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    [Fact]
    public async Task Update_RowExists_ReplacesAllFlagsAndUpdates()
    {
        // Arrange
        var stored = new UserNotificationPreferences(_tenantId, _userId);
        GivenStored(stored);

        // Act
        var result = await UpdateHandler()
            .Handle(new UpdateMyNotificationPreferencesCommand(false, true, false, true), CancellationToken.None);

        // Assert
        result.Should().Be(new NotificationPreferencesResponse(false, true, false, true));
        stored.EmailOnNewRequest.Should().BeFalse();
        stored.EmailOnStatusChange.Should().BeFalse();
        stored.DailyDigest.Should().BeTrue();
        _repositoryMock.Verify(x => x.UpdateAsync(stored, It.IsAny<CancellationToken>()), Times.Once);
        _repositoryMock.Verify(
            x => x.AddAsync(It.IsAny<UserNotificationPreferences>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    [Fact]
    public void DeserializeRequest_MissingFlag_Throws()
    {
        // Same defaults as ASP.NET Core MVC: a missing flag must fail binding, not become false
        var act = () =>
            JsonSerializer.Deserialize<UpdateMyNotificationPreferencesRequest>(
                """{"emailOnNewRequest":true,"emailOnAssignment":true,"emailOnStatusChange":true}""",
                new JsonSerializerOptions(JsonSerializerDefaults.Web)
            );

        act.Should().Throw<JsonException>();
    }

    private void GivenStored(UserNotificationPreferences? preferences) =>
        _repositoryMock
            .Setup(x => x.GetByUserIdAsync(_userId, _tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(preferences);

    private GetMyNotificationPreferencesQueryHandler GetHandler() =>
        new(_repositoryMock.Object, _currentUserServiceMock.Object);

    private UpdateMyNotificationPreferencesCommandHandler UpdateHandler() =>
        new(_repositoryMock.Object, _currentUserServiceMock.Object);
}
