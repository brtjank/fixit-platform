using FixIt.Application.Common;
using FixIt.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixIt.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.Id).IsRequired();

        builder.Property(n => n.TenantId).IsRequired();

        builder.Property(n => n.RecipientUserId).IsRequired();

        builder.Property(n => n.Type).IsRequired().HasMaxLength(100);

        builder.Property(n => n.ServiceRequestId);

        builder.Property(n => n.PreviousStatus).HasConversion<string>().HasMaxLength(50);

        builder.Property(n => n.NewStatus).HasConversion<string>().HasMaxLength(50);

        builder.Property(n => n.ActorUserId);

        builder.Property(n => n.SourceEventId).IsRequired();

        builder.Property(n => n.ReadAt);

        builder.Property(n => n.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.Property(n => n.CreatedAt).IsRequired();

        builder.Ignore(n => n.IsRead);

        // Indexes
        // One notification per recipient per event: makes the queue consumer idempotent
        builder
            .HasIndex(n => new { n.SourceEventId, n.RecipientUserId })
            .IsUnique()
            .HasDatabaseName(UniqueConstraints.NotificationSourceEventRecipient);
        // Bell list / unread count: recipient's rows filtered by ReadAt, newest first
        builder.HasIndex(n => new
        {
            n.RecipientUserId,
            n.ReadAt,
            n.CreatedAt,
        });
        builder.HasIndex(n => n.TenantId);
    }
}
