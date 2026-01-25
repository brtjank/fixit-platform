using FixIt.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixIt.Infrastructure.Persistence.Configurations;

public class ServiceRequestConfiguration : IEntityTypeConfiguration<ServiceRequest>
{
    public void Configure(EntityTypeBuilder<ServiceRequest> builder)
    {
        builder.ToTable("ServiceRequests");

        builder.HasKey(sr => sr.Id);

        builder.Property(sr => sr.Id).IsRequired();

        builder.Property(sr => sr.TenantId).IsRequired();

        builder.Property(sr => sr.Title).IsRequired().HasMaxLength(200);

        builder.Property(sr => sr.Description).IsRequired().HasMaxLength(2000);

        builder.Property(sr => sr.CustomerId).IsRequired();

        builder.Property(sr => sr.AssignedWorkerId);

        builder.Property(sr => sr.Status).IsRequired().HasConversion<string>().HasMaxLength(50);

        builder.Property(sr => sr.Notes).HasMaxLength(5000);

        builder.Property(sr => sr.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.Property(sr => sr.CreatedAt).IsRequired();

        // Indexes
        builder.HasIndex(sr => sr.TenantId);
        builder.HasIndex(sr => sr.CustomerId);
        builder.HasIndex(sr => sr.AssignedWorkerId);
        builder.HasIndex(sr => sr.Status);
        builder.HasIndex(sr => sr.IsDeleted);
        builder.HasIndex(sr => new { sr.TenantId, sr.Status });
    }
}
