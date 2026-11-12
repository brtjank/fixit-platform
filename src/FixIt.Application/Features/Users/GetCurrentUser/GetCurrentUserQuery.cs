using MediatR;

namespace FixIt.Application.Features.Users.GetCurrentUser;

public record GetCurrentUserQuery : IRequest<GetCurrentUserResponse>;
