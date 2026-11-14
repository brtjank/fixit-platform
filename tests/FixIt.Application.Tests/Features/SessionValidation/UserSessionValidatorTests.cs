using System.Security.Claims;
using FixIt.Application.Features.Auth.SessionValidation;
using FixIt.Application.Interfaces.Repositories;
using FluentAssertions;
using Moq;
using Xunit;

namespace FixIt.Application.Tests.Features.SessionValidation;

public class UserSessionValidatorTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly UserSessionValidator _validator;

    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _tenantId = Guid.NewGuid();

    public UserSessionValidatorTests()
    {
        _validator = new UserSessionValidator(_userRepositoryMock.Object);
        GivenUser(new UserSessionState(_userId, _tenantId, IsActive: true, IsDeleted: false, TokenVersion: 3));
    }

    [Fact]
    public async Task IsValidAsync_MatchingActiveUser_ReturnsTrue()
    {
        (await _validator.IsValidAsync(Principal())).Should().BeTrue();
    }

    [Fact]
    public async Task IsValidAsync_SubClaimOnly_ResolvesUser()
    {
        // Arrange
        var principal = new ClaimsPrincipal(
            new ClaimsIdentity(
                [
                    new Claim("sub", _userId.ToString()),
                    new Claim("TenantId", _tenantId.ToString()),
                    new Claim("tv", "3"),
                ],
                "Bearer"
            )
        );

        // Act & Assert
        (await _validator.IsValidAsync(principal)).Should().BeTrue();
    }

    [Fact]
    public async Task IsValidAsync_StaleTokenVersion_ReturnsFalse()
    {
        (await _validator.IsValidAsync(Principal(tokenVersion: "2"))).Should().BeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("abc")]
    [InlineData("-1")]
    public async Task IsValidAsync_MissingOrUnparseableTokenVersion_ReturnsFalse(string? tokenVersion)
    {
        (await _validator.IsValidAsync(Principal(tokenVersion: tokenVersion))).Should().BeFalse();
    }

    [Fact]
    public async Task IsValidAsync_UserMissing_ReturnsFalse()
    {
        // Arrange
        _userRepositoryMock
            .Setup(x => x.GetSessionStateAsync(_userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserSessionState?)null);

        // Act & Assert
        (await _validator.IsValidAsync(Principal())).Should().BeFalse();
    }

    [Fact]
    public async Task IsValidAsync_UserInactive_ReturnsFalse()
    {
        GivenUser(new UserSessionState(_userId, _tenantId, IsActive: false, IsDeleted: false, TokenVersion: 3));

        (await _validator.IsValidAsync(Principal())).Should().BeFalse();
    }

    [Fact]
    public async Task IsValidAsync_UserDeleted_ReturnsFalse()
    {
        GivenUser(new UserSessionState(_userId, _tenantId, IsActive: true, IsDeleted: true, TokenVersion: 3));

        (await _validator.IsValidAsync(Principal())).Should().BeFalse();
    }

    [Fact]
    public async Task IsValidAsync_TenantClaimMismatch_ReturnsFalse()
    {
        (await _validator.IsValidAsync(Principal(tenantId: Guid.NewGuid().ToString())))
            .Should()
            .BeFalse();
    }

    [Fact]
    public async Task IsValidAsync_MissingUserIdClaim_ReturnsFalseWithoutLookup()
    {
        // Arrange
        var principal = new ClaimsPrincipal(
            new ClaimsIdentity(
                [new Claim("TenantId", _tenantId.ToString()), new Claim("tv", "3")],
                "Bearer"
            )
        );

        // Act
        var result = await _validator.IsValidAsync(principal);

        // Assert
        result.Should().BeFalse();
        _userRepositoryMock.Verify(
            x => x.GetSessionStateAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never
        );
    }

    [Fact]
    public async Task IsValidAsync_MissingTenantClaim_ReturnsFalse()
    {
        (await _validator.IsValidAsync(Principal(tenantId: null))).Should().BeFalse();
    }

    private void GivenUser(UserSessionState state) =>
        _userRepositoryMock
            .Setup(x => x.GetSessionStateAsync(state.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(state);

    private ClaimsPrincipal Principal(string? tokenVersion = "3", string? tenantId = "")
    {
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, _userId.ToString()) };
        var tenant = tenantId == "" ? _tenantId.ToString() : tenantId;
        if (tenant is not null)
            claims.Add(new Claim("TenantId", tenant));
        if (tokenVersion is not null)
            claims.Add(new Claim("tv", tokenVersion));

        return new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
    }
}
