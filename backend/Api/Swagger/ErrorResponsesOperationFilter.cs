using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using Api.Common.Errors;

namespace Api.Swagger;

/// <summary>
/// Swagger operation filter that adds standard error response documentation to all endpoints.
/// </summary>
public class ErrorResponsesOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // Add standard error responses
        operation.Responses.TryAdd("400", CreateValidationErrorResponse());
        operation.Responses.TryAdd("401", CreateUnauthorizedErrorResponse());
        operation.Responses.TryAdd("403", CreateForbiddenErrorResponse());
        operation.Responses.TryAdd("404", CreateNotFoundErrorResponse());
        operation.Responses.TryAdd("409", CreateConflictErrorResponse());
        operation.Responses.TryAdd("410", CreateGoneErrorResponse());
        operation.Responses.TryAdd("422", CreateUnprocessableEntityErrorResponse());
        operation.Responses.TryAdd("429", CreateRateLimitErrorResponse());
        operation.Responses.TryAdd("500", CreateServerErrorResponse());
        operation.Responses.TryAdd("503", CreateServiceUnavailableErrorResponse());
        operation.Responses.TryAdd("504", CreateGatewayTimeoutErrorResponse());
    }

    private static OpenApiResponse CreateValidationErrorResponse()
    {
        return new OpenApiResponse
        {
            Description = "Validation Error - Request contains invalid data",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["application/json"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema { Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = nameof(ApiErrorResponse) } },
                    Example = new OpenApiObject
                    {
                        ["error"] = new OpenApiObject
                        {
                            ["status"] = new OpenApiInteger(400),
                            ["code"] = new OpenApiString("VALIDATION_ERROR"),
                            ["message"] = new OpenApiString("Validation failed"),
                            ["displayType"] = new OpenApiString("field"),
                            ["timestamp"] = new OpenApiString("2026-01-15T12:00:00Z"),
                            ["traceId"] = new OpenApiString("0HN4C0QNLR:00000001"),
                            ["details"] = new OpenApiObject
                            {
                                ["fields"] = new OpenApiObject
                                {
                                    ["email"] = new OpenApiArray
                                    {
                                        new OpenApiObject
                                        {
                                            ["code"] = new OpenApiString("VALIDATION_INVALID_EMAIL"),
                                            ["message"] = new OpenApiString("Invalid email format")
                                        }
                                    },
                                    ["password"] = new OpenApiArray
                                    {
                                        new OpenApiObject
                                        {
                                            ["code"] = new OpenApiString("VALIDATION_MIN_LENGTH"),
                                            ["message"] = new OpenApiString("Password must be at least 8 characters"),
                                            ["params"] = new OpenApiObject
                                            {
                                                ["minLength"] = new OpenApiInteger(8)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    private static OpenApiResponse CreateUnauthorizedErrorResponse()
    {
        return new OpenApiResponse
        {
            Description = "Unauthorized - Authentication required or token invalid",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["application/json"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema { Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = nameof(ApiErrorResponse) } },
                    Example = new OpenApiObject
                    {
                        ["error"] = new OpenApiObject
                        {
                            ["status"] = new OpenApiInteger(401),
                            ["code"] = new OpenApiString("AUTH_TOKEN_EXPIRED"),
                            ["message"] = new OpenApiString("Your session has expired. Please sign in again."),
                            ["displayType"] = new OpenApiString("page"),
                            ["timestamp"] = new OpenApiString("2026-01-15T12:00:00Z"),
                            ["traceId"] = new OpenApiString("0HN4C0QNLR:00000001")
                        }
                    }
                }
            }
        };
    }

    private static OpenApiResponse CreateForbiddenErrorResponse()
    {
        return new OpenApiResponse
        {
            Description = "Forbidden - Insufficient permissions for this action",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["application/json"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema { Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = nameof(ApiErrorResponse) } },
                    Example = new OpenApiObject
                    {
                        ["error"] = new OpenApiObject
                        {
                            ["status"] = new OpenApiInteger(403),
                            ["code"] = new OpenApiString("ACCESS_FORBIDDEN"),
                            ["message"] = new OpenApiString("You don't have permission to perform this action"),
                            ["displayType"] = new OpenApiString("page"),
                            ["timestamp"] = new OpenApiString("2026-01-15T12:00:00Z"),
                            ["traceId"] = new OpenApiString("0HN4C0QNLR:00000001")
                        }
                    }
                }
            }
        };
    }

    private static OpenApiResponse CreateNotFoundErrorResponse()
    {
        return new OpenApiResponse
        {
            Description = "Not Found - The requested resource does not exist",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["application/json"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema { Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = nameof(ApiErrorResponse) } },
                    Example = new OpenApiObject
                    {
                        ["error"] = new OpenApiObject
                        {
                            ["status"] = new OpenApiInteger(404),
                            ["code"] = new OpenApiString("RESOURCE_NOT_FOUND"),
                            ["message"] = new OpenApiString("Note not found"),
                            ["displayType"] = new OpenApiString("page"),
                            ["timestamp"] = new OpenApiString("2026-01-15T12:00:00Z"),
                            ["traceId"] = new OpenApiString("0HN4C0QNLR:00000001")
                        }
                    }
                }
            }
        };
    }

    private static OpenApiResponse CreateConflictErrorResponse()
    {
        return new OpenApiResponse
        {
            Description = "Conflict - Resource state conflict (e.g., duplicate entry, concurrent edit)",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["application/json"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema { Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = nameof(ApiErrorResponse) } },
                    Example = new OpenApiObject
                    {
                        ["error"] = new OpenApiObject
                        {
                            ["status"] = new OpenApiInteger(409),
                            ["code"] = new OpenApiString("CONFLICT_DUPLICATE_ENTRY"),
                            ["message"] = new OpenApiString("A user with this email already exists"),
                            ["displayType"] = new OpenApiString("toast"),
                            ["timestamp"] = new OpenApiString("2026-01-15T12:00:00Z"),
                            ["traceId"] = new OpenApiString("0HN4C0QNLR:00000001")
                        }
                    }
                }
            }
        };
    }

    private static OpenApiResponse CreateRateLimitErrorResponse()
    {
        return new OpenApiResponse
        {
            Description = "Too Many Requests - Rate limit exceeded",
            Headers = new Dictionary<string, OpenApiHeader>
            {
                ["Retry-After"] = new OpenApiHeader
                {
                    Description = "Number of seconds to wait before retrying",
                    Schema = new OpenApiSchema { Type = "integer" }
                }
            },
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["application/json"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema { Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = nameof(ApiErrorResponse) } },
                    Example = new OpenApiObject
                    {
                        ["error"] = new OpenApiObject
                        {
                            ["status"] = new OpenApiInteger(429),
                            ["code"] = new OpenApiString("RATE_LIMIT_EXCEEDED"),
                            ["message"] = new OpenApiString("Too many requests. Please wait 60 seconds before trying again."),
                            ["displayType"] = new OpenApiString("toast"),
                            ["timestamp"] = new OpenApiString("2026-01-15T12:00:00Z"),
                            ["traceId"] = new OpenApiString("0HN4C0QNLR:00000001"),
                            ["details"] = new OpenApiObject
                            {
                                ["context"] = new OpenApiObject
                                {
                                    ["retryAfterSeconds"] = new OpenApiInteger(60)
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    private static OpenApiResponse CreateServerErrorResponse()
    {
        return new OpenApiResponse
        {
            Description = "Internal Server Error - An unexpected error occurred",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["application/json"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema { Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = nameof(ApiErrorResponse) } },
                    Example = new OpenApiObject
                    {
                        ["error"] = new OpenApiObject
                        {
                            ["status"] = new OpenApiInteger(500),
                            ["code"] = new OpenApiString("SERVER_ERROR"),
                            ["message"] = new OpenApiString("An unexpected error occurred"),
                            ["displayType"] = new OpenApiString("toast"),
                            ["timestamp"] = new OpenApiString("2026-01-15T12:00:00Z"),
                            ["traceId"] = new OpenApiString("0HN4C0QNLR:00000001")
                        }
                    }
                }
            }
        };
    }

    private static OpenApiResponse CreateGoneErrorResponse()
    {
        return new OpenApiResponse
        {
            Description = "Gone - Resource was deleted",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["application/json"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema { Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = nameof(ApiErrorResponse) } },
                    Example = new OpenApiObject
                    {
                        ["error"] = new OpenApiObject
                        {
                            ["status"] = new OpenApiInteger(410),
                            ["code"] = new OpenApiString("RESOURCE_DELETED"),
                            ["message"] = new OpenApiString("This resource has been deleted"),
                            ["displayType"] = new OpenApiString("page"),
                            ["timestamp"] = new OpenApiString("2026-01-15T12:00:00Z"),
                            ["traceId"] = new OpenApiString("0HN4C0QNLR:00000001"),
                            ["details"] = new OpenApiObject
                            {
                                ["resourceType"] = new OpenApiString("page"),
                                ["resourceId"] = new OpenApiString("550e8400-e29b-41d4-a716-446655440000")
                            }
                        }
                    }
                }
            }
        };
    }

    private static OpenApiResponse CreateUnprocessableEntityErrorResponse()
    {
        return new OpenApiResponse
        {
            Description = "Unprocessable Entity - Business rule prevents operation",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["application/json"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema { Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = nameof(ApiErrorResponse) } },
                    Example = new OpenApiObject
                    {
                        ["error"] = new OpenApiObject
                        {
                            ["status"] = new OpenApiInteger(422),
                            ["code"] = new OpenApiString("OPERATION_NOT_ALLOWED"),
                            ["message"] = new OpenApiString("Cannot delete collection"),
                            ["displayType"] = new OpenApiString("inline"),
                            ["timestamp"] = new OpenApiString("2026-01-15T12:00:00Z"),
                            ["traceId"] = new OpenApiString("0HN4C0QNLR:00000001"),
                            ["details"] = new OpenApiObject
                            {
                                ["reason"] = new OpenApiString("has_dependencies"),
                                ["suggestion"] = new OpenApiString("Move or delete all pages from the collection first")
                            }
                        }
                    }
                }
            }
        };
    }

    private static OpenApiResponse CreateServiceUnavailableErrorResponse()
    {
        return new OpenApiResponse
        {
            Description = "Service Unavailable - Service temporarily unavailable or maintenance",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["application/json"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema { Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = nameof(ApiErrorResponse) } },
                    Example = new OpenApiObject
                    {
                        ["error"] = new OpenApiObject
                        {
                            ["status"] = new OpenApiInteger(503),
                            ["code"] = new OpenApiString("SERVER_UNAVAILABLE"),
                            ["message"] = new OpenApiString("Service temporarily unavailable. Please try again later."),
                            ["displayType"] = new OpenApiString("toast"),
                            ["timestamp"] = new OpenApiString("2026-01-15T12:00:00Z"),
                            ["traceId"] = new OpenApiString("0HN4C0QNLR:00000001"),
                            ["details"] = new OpenApiObject
                            {
                                ["retryable"] = new OpenApiBoolean(true),
                                ["retryAfterMs"] = new OpenApiInteger(5000)
                            }
                        }
                    }
                }
            }
        };
    }

    private static OpenApiResponse CreateGatewayTimeoutErrorResponse()
    {
        return new OpenApiResponse
        {
            Description = "Gateway Timeout - Operation took too long",
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["application/json"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema { Reference = new OpenApiReference { Type = ReferenceType.Schema, Id = nameof(ApiErrorResponse) } },
                    Example = new OpenApiObject
                    {
                        ["error"] = new OpenApiObject
                        {
                            ["status"] = new OpenApiInteger(504),
                            ["code"] = new OpenApiString("OPERATION_TIMEOUT"),
                            ["message"] = new OpenApiString("Operation took too long. Please try again."),
                            ["displayType"] = new OpenApiString("toast"),
                            ["timestamp"] = new OpenApiString("2026-01-15T12:00:00Z"),
                            ["traceId"] = new OpenApiString("0HN4C0QNLR:00000001"),
                            ["details"] = new OpenApiObject
                            {
                                ["retryable"] = new OpenApiBoolean(true)
                            }
                        }
                    }
                }
            }
        };
    }
}
