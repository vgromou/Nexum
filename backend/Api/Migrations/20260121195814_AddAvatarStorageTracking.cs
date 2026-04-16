using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAvatarStorageTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "avatar_file_size",
                schema: "auth",
                table: "users",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "avatar_storage_path",
                schema: "auth",
                table: "users",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "avatar_uploaded_at",
                schema: "auth",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_avatar_storage_path",
                schema: "auth",
                table: "users",
                column: "avatar_storage_path");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_users_avatar_storage_path",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "avatar_file_size",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "avatar_storage_path",
                schema: "auth",
                table: "users");

            migrationBuilder.DropColumn(
                name: "avatar_uploaded_at",
                schema: "auth",
                table: "users");
        }
    }
}
