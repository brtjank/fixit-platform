using FixIt.Application.Interfaces.Services;

namespace FixIt.Application.Tests.Common.Fakes;

/// <summary>
/// Executes queries with LINQ to Objects. Unlike a Moq setup it works for any element type,
/// including the anonymous projections used by grouped (aggregate) queries.
/// </summary>
public class InMemoryQueryableExecutor : IQueryableExecutor
{
    public Task<int> CountAsync<T>(
        IQueryable<T> queryable,
        CancellationToken cancellationToken = default
    ) => Task.FromResult(queryable.Count());

    public Task<List<T>> ToListAsync<T>(
        IQueryable<T> queryable,
        CancellationToken cancellationToken = default
    ) => Task.FromResult(queryable.ToList());
}
