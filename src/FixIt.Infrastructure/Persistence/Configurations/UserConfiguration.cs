using FixIt.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FixIt.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Id).IsRequired();

        builder.Property(u => u.TenantId).IsRequired();

        builder.Property(u => u.Email).IsRequired().HasMaxLength(255);

        builder.Property(u => u.FirstName).IsRequired().HasMaxLength(100);

        builder.Property(u => u.LastName).IsRequired().HasMaxLength(100);

        builder.Property(u => u.Role).IsRequired().HasConversion<string>().HasMaxLength(50);

        builder.Property(u => u.PasswordHash).HasMaxLength(256);

        builder.Property(u => u.IsActive).IsRequired().HasDefaultValue(true);

        builder.Property(u => u.TokenVersion).IsRequired();

        builder.Property(u => u.IsDeleted).IsRequired().HasDefaultValue(false);

        builder.Property(u => u.CreatedAt).IsRequired();

        // Indexes
        builder.HasIndex(u => u.TenantId);
        // Email uniqueness is global and case-insensitive: the unique expression index
        // "IX_Users_Email_Lower" on lower("Email") is created in migration HardenUsers
        // because EF Core cannot model expression indexes.
        builder.HasIndex(u => u.IsDeleted);
        builder.HasIndex(u => u.IsActive);
    }
}
