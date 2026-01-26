using FixIt.Domain.Entities;

namespace FixIt.Application.Features.GetWorkers;

public record GetWorkersResponse(IEnumerable<User> Items, int Page, int PageSize, int TotalCount);
