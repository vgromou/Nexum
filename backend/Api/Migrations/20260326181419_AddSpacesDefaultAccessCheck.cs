using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSpacesDefaultAccessCheck : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddCheckConstraint(
                name: "ck_spaces_default_access",
                schema: "spaces",
                table: "spaces",
                sql: "default_access IN ('Private', 'Viewer', 'Editor')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_spaces_default_access",
                schema: "spaces",
                table: "spaces");
        }
    }
}
