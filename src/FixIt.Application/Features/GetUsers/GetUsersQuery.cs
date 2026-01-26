using MediatR;

namespace FixIt.Application.Features.GetUsers;

public record GetUsersQuery(int Page = 1, int PageSize = 20) : IRequest<GetUsersResponse>;
