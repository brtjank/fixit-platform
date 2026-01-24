using FixIt.Application.Features.CreateServiceRequest;
using FluentValidation.TestHelper;
using Xunit;

namespace FixIt.Application.Tests.Features.CreateServiceRequest;

public class CreateServiceRequestCommandValidatorTests
{
    private readonly CreateServiceRequestCommandValidator _validator;

    public CreateServiceRequestCommandValidatorTests()
    {
        _validator = new CreateServiceRequestCommandValidator();
    }

    [Fact]
    public void Validate_ValidCommand_ShouldPass()
    {
        // Arrange
        var command = new CreateServiceRequestCommand(
            Guid.NewGuid(),
            "Fix broken sink",
            "The sink in kitchen is leaking",
            Guid.NewGuid()
        );

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_EmptyTenantId_ShouldFail()
    {
        // Arrange
        var command = new CreateServiceRequestCommand(
            Guid.Empty,
            "Fix broken sink",
            "The sink in kitchen is leaking",
            Guid.NewGuid()
        );

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.TenantId);
    }

    [Fact]
    public void Validate_EmptyTitle_ShouldFail()
    {
        // Arrange
        var command = new CreateServiceRequestCommand(
            Guid.NewGuid(),
            string.Empty,
            "The sink in kitchen is leaking",
            Guid.NewGuid()
        );

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Fact]
    public void Validate_TitleExceedsMaxLength_ShouldFail()
    {
        // Arrange
        var command = new CreateServiceRequestCommand(
            Guid.NewGuid(),
            new string('A', 201),
            "The sink in kitchen is leaking",
            Guid.NewGuid()
        );

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Fact]
    public void Validate_EmptyDescription_ShouldFail()
    {
        // Arrange
        var command = new CreateServiceRequestCommand(
            Guid.NewGuid(),
            "Fix broken sink",
            string.Empty,
            Guid.NewGuid()
        );

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Description);
    }

    [Fact]
    public void Validate_DescriptionExceedsMaxLength_ShouldFail()
    {
        // Arrange
        var command = new CreateServiceRequestCommand(
            Guid.NewGuid(),
            "Fix broken sink",
            new string('A', 2001),
            Guid.NewGuid()
        );

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Description);
    }

    [Fact]
    public void Validate_EmptyCustomerId_ShouldFail()
    {
        // Arrange
        var command = new CreateServiceRequestCommand(
            Guid.NewGuid(),
            "Fix broken sink",
            "The sink in kitchen is leaking",
            Guid.Empty
        );

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.CustomerId);
    }
}
