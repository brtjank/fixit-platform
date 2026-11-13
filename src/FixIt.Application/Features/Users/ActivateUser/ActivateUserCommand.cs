using MediatR;

namespace FixIt.Application.Features.Users.ActivateUser;

public record ActivateUserCommand(Guid UserId) : IRequest<ActivateUserResponse>;
