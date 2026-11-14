using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FixIt.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HardenUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Email becomes unique across all tenants, case-insensitively (login resolves accounts by
            // email alone). Abort with a clear message instead of a cryptic index error if existing
            // data would violate that; soft-deleted rows count, matching EmailExistsAsync.
            migrationBuilder.Sql(
                """
                DO $$
                DECLARE duplicates text;
                BEGIN
                    SELECT string_agg(email, ', ') INTO duplicates
                    FROM (
                        SELECT lower("Email") AS email
                        FROM "Users"
                        GROUP BY lower("Email")
                        HAVING count(*) > 1
                    ) d;

                    IF duplicates IS NOT NULL THEN
                        RAISE EXCEPTION 'Cannot create unique index IX_Users_Email_Lower: duplicate emails (case-insensitive) in "Users": %. Resolve them before applying migration HardenUsers.', duplicates;
                    END IF;
                END $$;
                """
            );

            migrationBuilder.DropIndex(
                name: "IX_Users_TenantId_Email",
                table: "Users");

            migrationBuilder.AddColumn<int>(
                name: "TokenVersion",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Expression index: EF Core cannot model it, so it is not in UserConfiguration/the snapshot
            migrationBuilder.Sql(
                """CREATE UNIQUE INDEX "IX_Users_Email_Lower" ON "Users" (lower("Email"));"""
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "IX_Users_Email_Lower";""");

            migrationBuilder.DropColumn(
                name: "TokenVersion",
                table: "Users");

            migrationBuilder.CreateIndex(
                name: "IX_Users_TenantId_Email",
                table: "Users",
                columns: new[] { "TenantId", "Email" },
                unique: true);
        }
    }
}
