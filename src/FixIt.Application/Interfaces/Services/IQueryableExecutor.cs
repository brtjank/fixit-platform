namespace FixIt.Application.Interfaces.Services;

/// <summary>
/// Executes IQueryable operations asynchronously.
/// </summary>
public interface IQueryableExecutor
{
    Task<int> CountAsync<T>(IQueryable<T> queryable, CancellationToken cancellationToken = default);
    Task<List<T>> ToListAsync<T>(
        IQueryable<T> queryable,
        CancellationToken cancellationToken = default
    );
}
