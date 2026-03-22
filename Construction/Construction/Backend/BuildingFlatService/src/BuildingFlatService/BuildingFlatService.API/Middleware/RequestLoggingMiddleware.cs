using System.Diagnostics;

namespace BuildingFlatService.API.Middleware;

/// <summary>
/// Logs every HTTP request start, end, and duration.
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;
        var method = context.Request.Method;
        var path = context.Request.Path;

        _logger.LogInformation("[Request Start] {Method} {Path} | TraceId: {TraceId}", method, path, traceId);

        var stopwatch = Stopwatch.StartNew();

        await _next(context);

        stopwatch.Stop();

        _logger.LogInformation(
            "[Request End] {Method} {Path} | StatusCode: {StatusCode} | Duration: {Duration}ms | TraceId: {TraceId}",
            method, path, context.Response.StatusCode, stopwatch.ElapsedMilliseconds, traceId);
    }
}
