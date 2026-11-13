using FixIt.Domain.Enums;
using MediatR;

namespace FixIt.Application.Features.Users.CreateUser;

public record CreateUserCommand(
    string Email,
    string FirstName,
    string LastName,
    UserRole Role,
    string Password
) : IRequest<CreateUserResponse>;
