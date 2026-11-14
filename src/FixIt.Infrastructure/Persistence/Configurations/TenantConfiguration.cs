using FixIt.Domain.Constants;
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

        builder.Property(t => t.Name).IsRequired().HasMaxLength(Tenant.NameMaxLength);

        builder.Property(t => t.Description).HasMaxLength(Tenant.DescriptionMaxLength);

        builder.Property(t => t.ContactEmail).HasMaxLength(Tenant.ContactEmailMaxLength);

        builder.Property(t => t.Phone).HasMaxLength(Tenant.PhoneMaxLength);

        builder.Property(t => t.Address).HasMaxLength(Tenant.AddressMaxLength);

        builder
            .Property(t => t.Timezone)
            .IsRequired()
            .HasMaxLength(Tenant.TimezoneMaxLength)
            .HasDefaultValue(Tenant.DefaultTimezone);

        builder
            .Property(t => t.Plan)
            .IsRequired()
            .HasMaxLength(Tenant.PlanMaxLength)
            .HasDefaultValue(TenantPlans.Team);

        builder.Property(t => t.IsActive).IsRequired().HasDefaultValue(true);

        builder.Property(t => t.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.Property(t => t.CreatedAt).IsRequired();

        // Indexes
        builder.HasIndex(t => t.TenantId);
        builder.HasIndex(t => t.IsDeleted);
        builder.HasIndex(t => t.IsActive);
    }
}
