using System.Text.Json;
using FixIt.Application.Features.Users.CreateUser;
using FixIt.Application.Features.Users.UpdateUser;
using FixIt.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace FixIt.Application.Tests.Features.CreateUser;

// Uses the same defaults as ASP.NET Core MVC so the property-level converter is exercised as in the API
public class CreateUserRequestDeserializationTests
{
    private static readonly JsonSerializerOptions WebOptions = new(JsonSerializerDefaults.Web);

    [Theory]
    [InlineData("2")]
    [InlineData("\"Worker\"")]
    [InlineData("\"worker\"")]
    public void Deserialize_RoleAsNumberOrName_ParsesRole(string roleJson)
    {
        var json =
            $$"""{"email":"a@b.c","firstName":"A","lastName":"B","role":{{roleJson}},"password":"Demo123!"}""";

        var request = JsonSerializer.Deserialize<CreateUserRequest>(json, WebOptions);

        request!.Role.Should().Be(UserRole.Worker);
    }

    [Fact]
    public void Deserialize_UpdateUserRoleName_ParsesRole()
    {
        var request = JsonSerializer.Deserialize<UpdateUserRequest>(
            """{"firstName":"A","lastName":"B","role":"Admin"}""",
            WebOptions
        );

        request!.Role.Should().Be(UserRole.Admin);
    }

    [Fact]
    public void Deserialize_UnknownRoleName_Throws()
    {
        var act = () =>
            JsonSerializer.Deserialize<CreateUserRequest>(
                """{"email":"a@b.c","firstName":"A","lastName":"B","role":"Owner","password":"Demo123!"}""",
                WebOptions
            );

        act.Should().Throw<JsonException>();
    }
}
