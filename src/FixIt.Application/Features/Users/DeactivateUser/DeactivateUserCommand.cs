using MediatR;

namespace FixIt.Application.Features.Users.DeactivateUser;

public record DeactivateUserCommand(Guid UserId) : IRequest<DeactivateUserResponse>;
