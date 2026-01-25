using FixIt.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixIt.Infrastructure.Persistence.Configurations;

public class ServiceLogConfiguration : IEntityTypeConfiguration<ServiceLog>
{
    public void Configure(EntityTypeBuilder<ServiceLog> builder)
    {
        builder.ToTable("ServiceLogs");

        builder.HasKey(sl => sl.Id);

        builder.Property(sl => sl.Id).IsRequired();

        builder.Property(sl => sl.TenantId).IsRequired();

        builder.Property(sl => sl.ServiceRequestId).IsRequired();

        builder
            .Property(sl => sl.PreviousStatus)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(sl => sl.NewStatus).IsRequired().HasConversion<string>().HasMaxLength(50);

        builder.Property(sl => sl.Notes).HasMaxLength(5000);

        builder.Property(sl => sl.ChangedByUserId);

        builder.Property(sl => sl.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.Property(sl => sl.CreatedAt).IsRequired();

        // Indexes
        builder.HasIndex(sl => sl.TenantId);
        builder.HasIndex(sl => sl.ServiceRequestId);
        builder.HasIndex(sl => sl.IsDeleted);
        builder.HasIndex(sl => new { sl.TenantId, sl.ServiceRequestId });
    }
}
