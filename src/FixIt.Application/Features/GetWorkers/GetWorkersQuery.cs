using MediatR;

namespace FixIt.Application.Features.GetWorkers;

public record GetWorkersQuery(int Page = 1, int PageSize = 10) : IRequest<GetWorkersResponse>;
