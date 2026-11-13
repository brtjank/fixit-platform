using FixIt.Domain.Constants;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Xunit;

namespace FixIt.Domain.Tests.Entities;

public class PasswordPolicyTests
{
    [Theory]
    [InlineData(PasswordPolicy.MinLength)]
    [InlineData(PasswordPolicy.MaxLength)]
    [InlineData(20)]
    public void EnsureValid_LengthWithinBounds_DoesNotThrow(int length)
    {
        var act = () => PasswordPolicy.EnsureValid(new string('a', length));

        act.Should().NotThrow();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(PasswordPolicy.MinLength - 1)]
    [InlineData(PasswordPolicy.MaxLength + 1)]
    public void EnsureValid_LengthOutOfBounds_ThrowsUserPasswordTooWeakException(int length)
    {
        var act = () => PasswordPolicy.EnsureValid(new string('a', length));

        act.Should()
            .Throw<UserPasswordTooWeakException>()
            .Which.ErrorCode.Should()
            .Be("USR_007_PASSWORD_TOO_WEAK");
    }

    [Fact]
    public void EnsureValid_Null_ThrowsUserPasswordTooWeakException()
    {
        var act = () => PasswordPolicy.EnsureValid(null);

        act.Should().Throw<UserPasswordTooWeakException>();
    }

    [Fact]
    public void Bounds_MatchContract()
    {
        PasswordPolicy.MinLength.Should().Be(8);
        PasswordPolicy.MaxLength.Should().Be(128);
    }
}
