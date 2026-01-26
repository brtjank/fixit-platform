using MediatR;

namespace FixIt.Application.Features.Users.GetWorkers;

public record GetWorkersQuery(int Page = 1, int PageSize = 10) : IRequest<GetWorkersResponse>;
