using System;
using System.Net;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSchemasAndRenameRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_users_organization_id",
                table: "users");

            migrationBuilder.EnsureSchema(
                name: "auth");

            migrationBuilder.EnsureSchema(
                name: "core");

            migrationBuilder.RenameTable(
                name: "users",
                newName: "users",
                newSchema: "auth");

            migrationBuilder.RenameTable(
                name: "refresh_tokens",
                newName: "refresh_tokens",
                newSchema: "auth");

            migrationBuilder.RenameTable(
                name: "organizations",
                newName: "organizations",
                newSchema: "core");

            migrationBuilder.RenameTable(
                name: "login_attempts",
                newName: "login_attempts",
                newSchema: "auth");

            migrationBuilder.RenameColumn(
                name: "role",
                schema: "auth",
                table: "users",
                newName: "organization_role");

            migrationBuilder.CreateTable(
                name: "audit_logs",
                schema: "auth",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    entity_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    entity_id = table.Column<Guid>(type: "uuid", nullable: true),
                    old_values = table.Column<string>(type: "jsonb", nullable: true),
                    new_values = table.Column<string>(type: "jsonb", nullable: true),
                    ip_address = table.Column<IPAddress>(type: "inet", nullable: true),
                    user_agent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_audit_logs", x => x.id);
                    table.ForeignKey(
                        name: "fk_audit_logs_organizations_organization_id",
                        column: x => x.organization_id,
                        principalSchema: "core",
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_audit_logs_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "auth",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

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

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_action",
                schema: "auth",
                table: "audit_logs",
                column: "action");

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_created_at",
                schema: "auth",
                table: "audit_logs",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_entity_type_entity_id",
                schema: "auth",
                table: "audit_logs",
                columns: new[] { "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_organization_id",
                schema: "auth",
                table: "audit_logs",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_user_id",
                schema: "auth",
                table: "audit_logs",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_logs",
                schema: "auth");

            migrationBuilder.DropIndex(
                name: "ix_users_active_admins",
                schema: "auth",
                table: "users");

            migrationBuilder.DropIndex(
                name: "ix_users_org_organization_role",
                schema: "auth",
                table: "users");

            migrationBuilder.RenameTable(
                name: "users",
                schema: "auth",
                newName: "users");

            migrationBuilder.RenameTable(
                name: "refresh_tokens",
                schema: "auth",
                newName: "refresh_tokens");

            migrationBuilder.RenameTable(
                name: "organizations",
                schema: "core",
                newName: "organizations");

            migrationBuilder.RenameTable(
                name: "login_attempts",
                schema: "auth",
                newName: "login_attempts");

            migrationBuilder.RenameColumn(
                name: "organization_role",
                table: "users",
                newName: "role");

            migrationBuilder.CreateIndex(
                name: "ix_users_organization_id",
                table: "users",
                column: "organization_id");
        }
    }
}
