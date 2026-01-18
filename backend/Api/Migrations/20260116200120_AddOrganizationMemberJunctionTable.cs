using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationMemberJunctionTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Create organization_members table
            migrationBuilder.CreateTable(
                name: "organization_members",
                schema: "core",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    joined_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_organization_members", x => x.id);
                    table.ForeignKey(
                        name: "fk_organization_members_organizations_organization_id",
                        column: x => x.organization_id,
                        principalSchema: "core",
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_organization_members_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_organization_members_org_role",
                schema: "core",
                table: "organization_members",
                columns: new[] { "organization_id", "role" });

            migrationBuilder.CreateIndex(
                name: "ix_organization_members_organization_id",
                schema: "core",
                table: "organization_members",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "ix_organization_members_user_id",
                schema: "core",
                table: "organization_members",
                column: "user_id",
                unique: true);

            // Step 2: Migrate existing user data to organization_members
            migrationBuilder.Sql(@"
                INSERT INTO core.organization_members (id, organization_id, user_id, role, joined_at, created_at, updated_at)
                SELECT
                    gen_random_uuid(),
                    organization_id,
                    id,
                    organization_role,
                    created_at,
                    NOW(),
                    NOW()
                FROM auth.users
                WHERE organization_id IS NOT NULL
            ");

            // Step 3: Drop FK and indexes from users table
            migrationBuilder.DropForeignKey(
                name: "fk_users_organizations_organization_id",
                schema: "auth",
                table: "users");

            migrationBuilder.DropIndex(
                name: "ix_users_active_admins",
                schema: "auth",
                table: "users");

            migrationBuilder.DropIndex(
                name: "ix_users_org_organization_role",
                schema: "auth",
                table: "users");

            // Step 4: Drop columns from users table
            migrationBuilder.DropColumn(
                name: "organization_id",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "organization_role",
                schema: "auth",
                table: "users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Step 1: Add columns back to users table
            migrationBuilder.AddColumn<Guid>(
                name: "organization_id",
                schema: "auth",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "organization_role",
                schema: "auth",
                table: "users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            // Step 2: Migrate data back from organization_members to users
            migrationBuilder.Sql(@"
                UPDATE auth.users u
                SET organization_id = m.organization_id,
                    organization_role = m.role
                FROM core.organization_members m
                WHERE u.id = m.user_id
            ");

            // Step 3: Make columns non-nullable
            migrationBuilder.AlterColumn<Guid>(
                name: "organization_id",
                schema: "auth",
                table: "users",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<string>(
                name: "organization_role",
                schema: "auth",
                table: "users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "User");

            // Step 4: Create indexes
            migrationBuilder.CreateIndex(
                name: "ix_users_active_admins",
                schema: "auth",
                table: "users",
                column: "organization_id",
                filter: "is_active = true AND organization_role = 'Admin'");

            migrationBuilder.CreateIndex(
                name: "ix_users_org_organization_role",
                schema: "auth",
                table: "users",
                columns: new[] { "organization_id", "organization_role" });

            // Step 5: Add FK constraint
            migrationBuilder.AddForeignKey(
                name: "fk_users_organizations_organization_id",
                schema: "auth",
                table: "users",
                column: "organization_id",
                principalSchema: "core",
                principalTable: "organizations",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            // Step 6: Drop organization_members table
            migrationBuilder.DropTable(
                name: "organization_members",
                schema: "core");
        }
    }
}
