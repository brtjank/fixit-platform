using MediatR;

namespace FixIt.Application.Features.Users.GetUserById;

public record GetUserByIdQuery(Guid UserId) : IRequest<GetUserByIdResponse>;
