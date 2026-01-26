using FixIt.Domain.Entities;

namespace FixIt.Application.Features.Users.GetUsers;

public record GetUsersResponse(IEnumerable<User> Items, int Page, int PageSize, int TotalCount);
