using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace PokeApi.Shared.Middleware;

// Constants for correlation tracking
public static class CorrelationConstants
{
    public const string CorrelationIdHeader = "X-Correlation-ID";
    public const string CorrelationIdItem = "CorrelationId";
}

// Request timing middleware
public class RequestTimingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestTimingMiddleware> _logger;

    public RequestTimingMiddleware(RequestDelegate next, ILogger<RequestTimingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestId = context.TraceIdentifier;

        try
        {
            _logger.LogInformation("Starting request {RequestId} {Method} {Path}",
                requestId, context.Request.Method, context.Request.Path);

            await _next(context);
        }
        finally
        {
            stopwatch.Stop();

            _logger.LogInformation("Completed request {RequestId} {Method} {Path} in {Duration}ms with status {StatusCode}",
                requestId,
                context.Request.Method,
                context.Request.Path,
                stopwatch.ElapsedMilliseconds,
                context.Response.StatusCode);
        }
    }
}

// Correlation ID middleware
public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = GetOrCreateCorrelationId(context);

        // Add to response headers
        context.Response.Headers.TryAdd(CorrelationConstants.CorrelationIdHeader, correlationId);

        // Add to HttpContext for logging
        context.Items[CorrelationConstants.CorrelationIdItem] = correlationId;

        using (context.RequestServices.GetRequiredService<ILoggerFactory>()
            .CreateLogger<CorrelationIdMiddleware>()
            .BeginScope(new Dictionary<string, object> { ["CorrelationId"] = correlationId }))
        {
            await _next(context);
        }
    }

    private static string GetOrCreateCorrelationId(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue(CorrelationConstants.CorrelationIdHeader, out var existingCorrelationId) &&
            !string.IsNullOrWhiteSpace(existingCorrelationId))
        {
            return existingCorrelationId.ToString();
        }

        return Guid.NewGuid().ToString();
    }
}

// Global exception handling middleware
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
            _logger.LogError(ex, "An unhandled exception occurred during request {RequestId}", context.TraceIdentifier);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = 500;

        var response = new
        {
            success = false,
            errorMessage = "An internal server error occurred",
            timestamp = DateTime.UtcNow,
            requestId = context.TraceIdentifier
        };

        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
    }
}

// Helper interfaces for dependency injection (optional)
public interface ICorrelationIdProvider
{
    string GetOrCreateCorrelationId();
    void SetCorrelationId(string correlationId);
}

public class CorrelationContext
{
    public string CorrelationId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}