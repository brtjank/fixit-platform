using FixIt.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixIt.Infrastructure.Persistence.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("Tenants");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id).IsRequired();

        builder.Property(t => t.TenantId).IsRequired();

        builder.Property(t => t.Name).IsRequired().HasMaxLength(200);

        builder.Property(t => t.Description).HasMaxLength(1000);

        builder.Property(t => t.IsActive).IsRequired().HasDefaultValue(true);

        builder.Property(t => t.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.Property(t => t.CreatedAt).IsRequired();

        // Indexes
        builder.HasIndex(t => t.TenantId);
        builder.HasIndex(t => t.IsDeleted);
        builder.HasIndex(t => t.IsActive);
    }
}
