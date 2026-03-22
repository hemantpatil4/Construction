using System.Diagnostics;
using System.Net;
using System.Text.Json;
using BuildingFlatService.API.Models;
using BuildingFlatService.Application.Exceptions;
using ValidationException = BuildingFlatService.Application.Exceptions.ValidationException;

namespace BuildingFlatService.API.Middleware;

/// <summary>
/// Global exception handling middleware.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;

        var (statusCode, message, errors) = exception switch
        {
            ValidationException validationEx => (
                (int)HttpStatusCode.BadRequest,
                validationEx.Message,
                validationEx.Errors
            ),
            NotFoundException notFoundEx => (
                (int)HttpStatusCode.NotFound,
                notFoundEx.Message,
                (IDictionary<string, string[]>?)null
            ),
            UnauthorizedException unauthorizedEx => (
                (int)HttpStatusCode.Unauthorized,
                unauthorizedEx.Message,
                (IDictionary<string, string[]>?)null
            ),
            _ => (
                (int)HttpStatusCode.InternalServerError,
                "An unexpected error occurred. Please try again later.",
                (IDictionary<string, string[]>?)null
            )
        };

        if (statusCode >= 500)
            _logger.LogError(exception, "Unhandled exception | TraceId: {TraceId} | Path: {Path}", traceId, context.Request.Path);
        else
            _logger.LogWarning("Handled exception: {ExceptionType} | Message: {Message} | TraceId: {TraceId}",
                exception.GetType().Name, exception.Message, traceId);

        var response = new ApiErrorResponse
        {
            StatusCode = statusCode,
            Message = message,
            Errors = errors,
            TraceId = traceId,
            Timestamp = DateTime.UtcNow
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}
