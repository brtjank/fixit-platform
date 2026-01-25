using FixIt.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixIt.Infrastructure.Persistence.Configurations;

public class WorkerProfileConfiguration : IEntityTypeConfiguration<WorkerProfile>
{
    public void Configure(EntityTypeBuilder<WorkerProfile> builder)
    {
        builder.ToTable("WorkerProfiles");

        builder.HasKey(wp => wp.Id);

        builder.Property(wp => wp.Id).IsRequired();

        builder.Property(wp => wp.TenantId).IsRequired();

        builder.Property(wp => wp.UserId).IsRequired();

        builder.Property(wp => wp.Specialization).HasMaxLength(200);

        builder.Property(wp => wp.PhoneNumber).HasMaxLength(20);

        builder.Property(wp => wp.IsAvailable).IsRequired().HasDefaultValue(true);

        builder.Property(wp => wp.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.Property(wp => wp.CreatedAt).IsRequired();

        // Indexes
        builder.HasIndex(wp => wp.TenantId);
        builder.HasIndex(wp => wp.UserId);
        builder.HasIndex(wp => new { wp.TenantId, wp.UserId }).IsUnique();
        builder.HasIndex(wp => wp.IsDeleted);
        builder.HasIndex(wp => wp.IsAvailable);
    }
}
