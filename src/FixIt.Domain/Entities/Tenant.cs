namespace FixIt.Domain.Entities;

public class Tenant : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool IsActive { get; private set; } = true;

    private Tenant() { }

    public Tenant(Guid id, string name, string? description = null)
    {
        Id = id;
        TenantId = id;
        Name = name;
        Description = description;
    }

    public void UpdateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name cannot be null or empty.", nameof(name));

        Name = name;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void Activate()
    {
        if (IsDeleted)
            throw new InvalidOperationException("Cannot activate a deleted tenant.");

        IsActive = true;
    }

    public new void SoftDelete()
    {
        IsDeleted = true;
        IsActive = false;
    }
}
