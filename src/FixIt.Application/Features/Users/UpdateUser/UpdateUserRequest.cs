using System.Text.Json.Serialization;
using FixIt.Domain.Enums;

namespace FixIt.Application.Features.Users.UpdateUser;

public record UpdateUserRequest(
    string FirstName,
    string LastName,
    // Accepts both the numeric value (the API convention) and the role name
    [property: JsonConverter(typeof(JsonStringEnumConverter<UserRole>))] UserRole Role
);
