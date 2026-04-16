using System;
using System.Net;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserLastLoginAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "email",
                schema: "auth",
                table: "login_attempts",
                newName: "login_identifier");

            migrationBuilder.RenameIndex(
                name: "ix_login_attempts_email_created_at",
                schema: "auth",
                table: "login_attempts",
                newName: "ix_login_attempts_login_identifier_created_at");

            migrationBuilder.RenameIndex(
                name: "ix_login_attempts_email",
                schema: "auth",
                table: "login_attempts",
                newName: "ix_login_attempts_login_identifier");

            migrationBuilder.AddColumn<DateTime>(
                name: "last_login_at",
                schema: "auth",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AlterColumn<IPAddress>(
                name: "ip_address",
                schema: "auth",
                table: "login_attempts",
                type: "inet",
                nullable: true,
                oldClrType: typeof(IPAddress),
                oldType: "inet");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "last_login_at",
                schema: "auth",
                table: "users");

            migrationBuilder.RenameColumn(
                name: "login_identifier",
                schema: "auth",
                table: "login_attempts",
                newName: "email");

            migrationBuilder.RenameIndex(
                name: "ix_login_attempts_login_identifier_created_at",
                schema: "auth",
                table: "login_attempts",
                newName: "ix_login_attempts_email_created_at");

            migrationBuilder.RenameIndex(
                name: "ix_login_attempts_login_identifier",
                schema: "auth",
                table: "login_attempts",
                newName: "ix_login_attempts_email");

            migrationBuilder.AlterColumn<IPAddress>(
                name: "ip_address",
                schema: "auth",
                table: "login_attempts",
                type: "inet",
                nullable: false,
                oldClrType: typeof(IPAddress),
                oldType: "inet",
                oldNullable: true);
        }
    }
}
