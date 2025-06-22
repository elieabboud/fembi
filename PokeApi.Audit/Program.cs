using Asp.Versioning;
using AspNetCoreRateLimit;
using HealthChecks.UI.Client;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi.Models;
using PokeApi.Audit.Data;
using PokeApi.Audit.Interfaces;
using PokeApi.Audit.Services;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.Interfaces;
using PokeApi.Shared.Middleware;
using PokeApi.Shared.Services;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// FIXED: Add Memory Cache first (required for rate limiting)
builder.Services.AddMemoryCache();

// Configuration
builder.Services.Configure<RabbitMQOptions>(
    builder.Configuration.GetSection(RabbitMQOptions.SectionName));

// Database Configuration
builder.Services.AddDbContext<AuditDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorCodesToAdd: null);
    });

    // Enable sensitive data logging in development
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// RabbitMQ Services with enhanced error handling
builder.Services.AddSingleton<IRabbitMQService>(serviceProvider =>
{
    var options = serviceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<RabbitMQOptions>>();
    var logger = serviceProvider.GetRequiredService<ILogger<RabbitMQService>>();

    var maxRetries = 5;
    var retryDelay = TimeSpan.FromSeconds(5);

    for (int attempt = 1; attempt <= maxRetries; attempt++)
    {
        try
        {
            var service = new RabbitMQService(options, logger);
            logger.LogInformation("RabbitMQ service initialized successfully for Audit service on attempt {Attempt}", attempt);
            return service;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to initialize RabbitMQ service for Audit service on attempt {Attempt}/{MaxRetries}", attempt, maxRetries);

            if (attempt == maxRetries)
            {
                logger.LogCritical("Failed to initialize RabbitMQ service after {MaxRetries} attempts. Service will start with degraded functionality.", maxRetries);
                throw;
            }

            Thread.Sleep(retryDelay);
            retryDelay = TimeSpan.FromSeconds(retryDelay.TotalSeconds * 2); // Exponential backoff
        }
    }

    throw new InvalidOperationException("This line should never be reached");
});

// FIXED: Audit Services - change IAuditService to Singleton to match the hosted service
builder.Services.AddSingleton<IAuditService>(serviceProvider =>
{
    // Create a scope factory to get scoped services when needed
    var scopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();
    return new AuditServiceSingleton(scopeFactory, serviceProvider.GetRequiredService<ILogger<AuditService>>());
});

// Register the hosted service
builder.Services.AddHostedService<AuditMessageService>();

// Rate Limiting - Memory cache is already added above
builder.Services.Configure<IpRateLimitOptions>(options =>
{
    options.EnableEndpointRateLimiting = true;
    options.StackBlockedRequests = false;
    options.HttpStatusCode = 429;
    options.RealIpHeader = "X-Real-IP";
    options.GeneralRules = new List<RateLimitRule>
    {
        new RateLimitRule
        {
            Endpoint = "*",
            Period = "1m",
            Limit = 100,
        },
        new RateLimitRule
        {
            Endpoint = "*",
            Period = "1h",
            Limit = 1000,
        }
    };
});

builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();

// API Versioning
builder.Services.AddApiVersioning(opt =>
{
    opt.DefaultApiVersion = new ApiVersion(1, 0);
    opt.AssumeDefaultVersionWhenUnspecified = true;
    opt.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new QueryStringApiVersionReader("version"),
        new HeaderApiVersionReader("X-Version")
    );
}).AddApiExplorer(setup =>
{
    setup.GroupNameFormat = "'v'VVV";
    setup.SubstituteApiVersionInUrl = true;
});

// Health Checks
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy("Audit API is running"))
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!, name: "postgres")
    .AddCheck<PokeApi.Shared.Configurations.RabbitMQHealthCheck>("rabbitmq");

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Pokemon API Audit Service",
        Version = "v1",
        Description = "Distributed auditing service for Pokemon API requests with PostgreSQL storage and RabbitMQ integration",
        Contact = new OpenApiContact
        {
            Name = "Development Team",
            Email = "dev@company.com"
        }
    });

    // Include XML comments
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }

    c.EnableAnnotations();
});

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// Application Insights (optional)
if (!string.IsNullOrEmpty(builder.Configuration.GetConnectionString("ApplicationInsights")))
{
    builder.Services.AddApplicationInsightsTelemetry();
}

var app = builder.Build();

// Database Migration and Initialization with retry logic
using (var scope = app.Services.CreateScope())
{
    var maxRetries = 10;
    var retryDelay = TimeSpan.FromSeconds(5);

    for (int attempt = 1; attempt <= maxRetries; attempt++)
    {
        try
        {
            var context = scope.ServiceProvider.GetRequiredService<AuditDbContext>();

            app.Logger.LogInformation("Attempting database initialization, attempt {Attempt}/{MaxRetries}", attempt, maxRetries);

            // Test database connection
            await context.Database.CanConnectAsync();

            // Ensure database is created and up to date
            await context.Database.EnsureCreatedAsync();

            // Apply any pending migrations if they exist
            var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
            if (pendingMigrations.Any())
            {
                app.Logger.LogInformation("Applying {Count} pending migrations", pendingMigrations.Count());
                await context.Database.MigrateAsync();
            }

            app.Logger.LogInformation("Database initialization completed successfully");
            break;
        }
        catch (Exception ex)
        {
            app.Logger.LogError(ex, "Database initialization failed on attempt {Attempt}/{MaxRetries}", attempt, maxRetries);

            if (attempt == maxRetries)
            {
                app.Logger.LogCritical("Database initialization failed after {MaxRetries} attempts. Service will start with degraded functionality.", maxRetries);
                // Don't throw - allow service to start and retry later
                break;
            }

            await Task.Delay(retryDelay);
            retryDelay = TimeSpan.FromSeconds(retryDelay.TotalSeconds * 1.5); // Exponential backoff
        }
    }
}

// Initialize RabbitMQ infrastructure after database
using (var scope = app.Services.CreateScope())
{
    try
    {
        var rabbitMQService = scope.ServiceProvider.GetRequiredService<IRabbitMQService>();

        // Wait a bit for RabbitMQ to be fully ready
        await Task.Delay(2000);

        rabbitMQService.DeclareInfrastructure();
        app.Logger.LogInformation("RabbitMQ infrastructure initialized successfully");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to initialize RabbitMQ infrastructure. Message processing may be degraded.");
        // Don't throw - allow service to start and retry later
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Pokemon API Audit Service V1");
        c.RoutePrefix = string.Empty;
        c.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.List);
        c.DisplayRequestDuration();
    });
}

// Middleware pipeline
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<RequestTimingMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();

// Rate limiting
app.UseIpRateLimiting();

app.UseCors("AllowAll");
app.UseAuthorization();

app.MapControllers();

// Health checks with detailed UI
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
    ResultStatusCodes =
    {
        [HealthStatus.Healthy] = StatusCodes.Status200OK,
        [HealthStatus.Degraded] = StatusCodes.Status200OK,
        [HealthStatus.Unhealthy] = StatusCodes.Status503ServiceUnavailable
    }
});

// Simple health check endpoints
app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false
});

Console.WriteLine("Audit API starting...");
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");
Console.WriteLine($"Database: {app.Configuration.GetConnectionString("DefaultConnection")}");
Console.WriteLine($"RabbitMQ Host: {app.Configuration.GetValue<string>("RabbitMQ:HostName")}");

app.Run();

// FIXED: Singleton wrapper for AuditService to work with hosted service
public class AuditServiceSingleton : IAuditService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AuditService> _logger;

    public AuditServiceSingleton(IServiceScopeFactory scopeFactory, ILogger<AuditService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task<long> LogApiRequest(string requestId, string correlationId, string source,
        int limit, int offset, bool success, object? responseData = null,
        string? errorMessage = null, int? processingTimeMs = null,
        string? externalApiUrl = null, bool cacheHit = false)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AuditDbContext>();
        var auditService = new AuditService(context, _logger);

        return await auditService.LogApiRequest(requestId, correlationId, source, limit, offset,
            success, responseData, errorMessage, processingTimeMs, externalApiUrl, cacheHit);
    }

    public async Task<PokeApi.Audit.Models.AuditLog?> GetAuditLog(long id)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AuditDbContext>();
        var auditService = new AuditService(context, _logger);

        return await auditService.GetAuditLog(id);
    }

    public async Task<PokeApi.Audit.Models.AuditLog?> GetAuditLogByRequestId(string requestId)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AuditDbContext>();
        var auditService = new AuditService(context, _logger);

        return await auditService.GetAuditLogByRequestId(requestId);
    }

    public async Task<IEnumerable<PokeApi.Audit.Models.AuditLog>> GetAuditLogs(int page = 1, int pageSize = 50,
        string? source = null, bool? success = null)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AuditDbContext>();
        var auditService = new AuditService(context, _logger);

        return await auditService.GetAuditLogs(page, pageSize, source, success);
    }

    public async Task<IEnumerable<PokeApi.Audit.Models.AuditLog>> GetAuditLogsByCorrelationId(string correlationId)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AuditDbContext>();
        var auditService = new AuditService(context, _logger);

        return await auditService.GetAuditLogsByCorrelationId(correlationId);
    }

    public async Task<IEnumerable<PokeApi.Audit.Models.AuditStatistics>> GetAuditStatistics()
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AuditDbContext>();
        var auditService = new AuditService(context, _logger);

        return await auditService.GetAuditStatistics();
    }

    public async Task<PokeApi.Audit.Models.AuditStatistics?> GetAuditStatisticsBySource(string source)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AuditDbContext>();
        var auditService = new AuditService(context, _logger);

        return await auditService.GetAuditStatisticsBySource(source);
    }
}