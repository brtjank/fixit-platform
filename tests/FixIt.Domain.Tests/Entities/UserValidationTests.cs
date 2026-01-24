using FixIt.Domain.Entities;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Xunit;

namespace FixIt.Domain.Tests.Entities;

public class UserValidationTests
{
    [Fact]
    public void Constructor_EmptyEmail_ThrowsUserEmailRequiredException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();

        // Act
        var act = () => new User(tenantId, string.Empty, "John", "Doe", UserRole.Customer);

        // Assert
        act.Should().Throw<UserEmailRequiredException>();
    }

    [Fact]
    public void Constructor_EmptyFirstName_ThrowsUserNameRequiredException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();

        // Act
        var act = () =>
            new User(tenantId, "test@example.com", string.Empty, "Doe", UserRole.Customer);

        // Assert
        var exception = act.Should().Throw<UserNameRequiredException>().Which;
        exception.FieldName.Should().Be("FirstName");
    }

    [Fact]
    public void Constructor_EmptyLastName_ThrowsUserNameRequiredException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();

        // Act
        var act = () =>
            new User(tenantId, "test@example.com", "John", string.Empty, UserRole.Customer);

        // Assert
        var exception = act.Should().Throw<UserNameRequiredException>().Which;
        exception.FieldName.Should().Be("LastName");
    }

    [Fact]
    public void UpdateName_EmptyFirstName_ThrowsUserNameRequiredException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var user = new User(tenantId, "test@example.com", "John", "Doe", UserRole.Customer);

        // Act
        var act = () => user.UpdateName(string.Empty, "Smith");

        // Assert
        var exception = act.Should().Throw<UserNameRequiredException>().Which;
        exception.FieldName.Should().Be("FirstName");
    }

    [Fact]
    public void UpdateName_EmptyLastName_ThrowsUserNameRequiredException()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var user = new User(tenantId, "test@example.com", "John", "Doe", UserRole.Customer);

        // Act
        var act = () => user.UpdateName("Jane", string.Empty);

        // Assert
        var exception = act.Should().Throw<UserNameRequiredException>().Which;
        exception.FieldName.Should().Be("LastName");
    }
}
