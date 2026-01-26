using FixIt.Application.Interfaces.Services;
using Microsoft.EntityFrameworkCore;

namespace FixIt.Infrastructure.Services;

public class QueryableExecutor : IQueryableExecutor
{
    public Task<int> CountAsync<T>(
        IQueryable<T> queryable,
        CancellationToken cancellationToken = default
    )
    {
        return EntityFrameworkQueryableExtensions.CountAsync(queryable, cancellationToken);
    }

    public Task<List<T>> ToListAsync<T>(
        IQueryable<T> queryable,
        CancellationToken cancellationToken = default
    )
    {
        return EntityFrameworkQueryableExtensions.ToListAsync(queryable, cancellationToken);
    }
}
