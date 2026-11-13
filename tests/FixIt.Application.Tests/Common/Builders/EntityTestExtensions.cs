using FixIt.Domain.Entities;

namespace FixIt.Application.Tests.Common.Builders;

public static class EntityTestExtensions
{
    // CreatedAt is set by the entity itself; tests need to place rows at specific moments
    public static T WithCreatedAt<T>(this T entity, DateTime createdAt)
        where T : BaseEntity
    {
        typeof(BaseEntity).GetProperty(nameof(BaseEntity.CreatedAt))!.SetValue(entity, createdAt);
        return entity;
    }
}
