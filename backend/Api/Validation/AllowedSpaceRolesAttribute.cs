using System.ComponentModel.DataAnnotations;
using Api.Models;

namespace Api.Validation;

/// <summary>
/// Validates that a SpaceRole value is one of the explicitly allowed roles.
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter, AllowMultiple = false)]
public sealed class AllowedSpaceRolesAttribute : ValidationAttribute
{
    private readonly SpaceRole[] _allowedRoles;

    public AllowedSpaceRolesAttribute(params SpaceRole[] allowedRoles)
    {
        _allowedRoles = allowedRoles;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is null)
            return ValidationResult.Success;

        if (value is SpaceRole role && !_allowedRoles.Contains(role))
        {
            var allowed = string.Join(", ", _allowedRoles);
            return new ValidationResult(
                $"Role '{role}' is not allowed. Allowed values: {allowed}",
                [validationContext.MemberName!]);
        }

        return ValidationResult.Success;
    }
}
