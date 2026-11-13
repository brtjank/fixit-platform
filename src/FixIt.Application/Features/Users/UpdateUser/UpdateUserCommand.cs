using FixIt.Domain.Enums;
using MediatR;

namespace FixIt.Application.Features.Users.UpdateUser;

public record UpdateUserCommand(Guid UserId, string FirstName, string LastName, UserRole Role)
    : IRequest<UpdateUserResponse>;
