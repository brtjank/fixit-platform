using FixIt.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixIt.Infrastructure.Persistence.Configurations;

public class UserNotificationPreferencesConfiguration
    : IEntityTypeConfiguration<UserNotificationPreferences>
{
    public void Configure(EntityTypeBuilder<UserNotificationPreferences> builder)
    {
        builder.ToTable("UserNotificationPreferences");

        builder.HasKey(np => np.Id);

        builder.Property(np => np.Id).IsRequired();

        builder.Property(np => np.TenantId).IsRequired();

        builder.Property(np => np.UserId).IsRequired();

        builder.Property(np => np.EmailOnNewRequest).IsRequired();

        builder.Property(np => np.EmailOnAssignment).IsRequired();

        builder.Property(np => np.EmailOnStatusChange).IsRequired();

        builder.Property(np => np.DailyDigest).IsRequired();

        builder.Property(np => np.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.Property(np => np.CreatedAt).IsRequired();

        // Indexes
        builder.HasIndex(np => np.TenantId);
        builder.HasIndex(np => new { np.TenantId, np.UserId }).IsUnique();
        builder.HasIndex(np => np.IsDeleted);
    }
}
