namespace FixIt.Domain.Entities;

public abstract class BaseEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public Guid TenantId { get; protected set; }
    public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;
    public bool IsDeleted { get; protected set; }

    protected BaseEntity() { }

    protected BaseEntity(Guid tenantId)
    {
        TenantId = tenantId;
    }

    public void SoftDelete()
    {
        IsDeleted = true;
    }
}
