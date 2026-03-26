using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSpacesSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "spaces");

            migrationBuilder.CreateTable(
                name: "spaces",
                schema: "spaces",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    icon = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    default_access = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    is_archived = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_spaces", x => x.id);
                    table.ForeignKey(
                        name: "fk_spaces_organizations_organization_id",
                        column: x => x.organization_id,
                        principalSchema: "core",
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "space_members",
                schema: "spaces",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    space_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    joined_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    invited_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_space_members", x => x.id);
                    table.CheckConstraint("ck_space_members_role_not_private", "role <> 'Private'");
                    table.ForeignKey(
                        name: "fk_space_members_spaces_space_id",
                        column: x => x.space_id,
                        principalSchema: "spaces",
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_space_members_users_invited_by",
                        column: x => x.invited_by,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_space_members_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "space_settings",
                schema: "spaces",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_space_settings", x => x.id);
                    table.ForeignKey(
                        name: "fk_space_settings_spaces_id",
                        column: x => x.id,
                        principalSchema: "spaces",
                        principalTable: "spaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_space_members_invited_by",
                schema: "spaces",
                table: "space_members",
                column: "invited_by");

            migrationBuilder.CreateIndex(
                name: "ix_space_members_space_role",
                schema: "spaces",
                table: "space_members",
                columns: new[] { "space_id", "role" });

            migrationBuilder.CreateIndex(
                name: "ix_space_members_user",
                schema: "spaces",
                table: "space_members",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "uq_space_members_space_user",
                schema: "spaces",
                table: "space_members",
                columns: new[] { "space_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_spaces_organization",
                schema: "spaces",
                table: "spaces",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "uq_spaces_org_slug",
                schema: "spaces",
                table: "spaces",
                columns: new[] { "organization_id", "slug" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "space_members",
                schema: "spaces");

            migrationBuilder.DropTable(
                name: "space_settings",
                schema: "spaces");

            migrationBuilder.DropTable(
                name: "spaces",
                schema: "spaces");
        }
    }
}
