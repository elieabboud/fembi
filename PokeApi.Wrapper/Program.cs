using Asp.Versioning;
using AspNetCoreRateLimit;
using HealthChecks.UI.Client;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi.Models;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Interfaces;
using PokeApi.Shared.Middleware;
using PokeApi.Shared.Services;
using PokeApi.Wrapper.HealthChecks;
using PokeApi.Wrapper.Interfaces;
using PokeApi.Wrapper.Services;
using Polly;
using Polly.Extensions.Http;
using System.Reflection;
using RateLimitOptions = PokeApi.Shared.Configurations.RateLimitOptions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// Configuration
builder.Services.Configure<ExternalApiOptions>(
    builder.Configuration.GetSection(ExternalApiOptions.SectionName));
builder.Services.Configure<RateLimitOptions>(
    builder.Configuration.GetSection(RateLimitOptions.SectionName));
builder.Services.Configure<RabbitMQOptions>(
    builder.Configuration.GetSection(RabbitMQOptions.SectionName));

// Memory Cache
builder.Services.AddMemoryCache();

// RabbitMQ Services with graceful error handling
builder.Services.AddSingleton<IRabbitMQService>(serviceProvider =>
{
    var options = serviceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<RabbitMQOptions>>();
    var logger = serviceProvider.GetRequiredService<ILogger<RabbitMQService>>();

    try
    {
        var service = new RabbitMQService(options, logger);
        logger.LogInformation("RabbitMQ service initialized successfully");
        return service;
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to initialize RabbitMQ service, creating stub implementation");
        return new StubRabbitMQService(logger);
    }
});

builder.Services.AddSingleton<IPokemonMessageService, PokemonMessageService>();

// Register PokemonMessageService as hosted service
builder.Services.AddHostedService<PokemonMessageService>();

// Rate Limiting
builder.Services.AddMemoryCache();
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
builder.Services.Configure<IpRateLimitPolicies>(builder.Configuration.GetSection("IpRateLimitPolicies"));
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

// Polly Policies
static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .WaitAndRetryAsync(
            retryCount: 3,
            sleepDurationProvider: retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
            onRetry: (outcome, timespan, retryCount, context) =>
            {
                Console.WriteLine($"Retry {retryCount} after {timespan.TotalMilliseconds}ms");
            });
}

static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .CircuitBreakerAsync(
            handledEventsAllowedBeforeBreaking: 3,
            durationOfBreak: TimeSpan.FromSeconds(30),
            onBreak: (exception, duration) =>
            {
                Console.WriteLine($"Circuit breaker opened for {duration}");
            },
            onReset: () =>
            {
                Console.WriteLine("Circuit breaker closed");
            });
}

// Configure HttpClient for external API calls with Polly
builder.Services.AddHttpClient<IPokeApiService, PokeApiService>((serviceProvider, client) =>
{
    var options = serviceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<ExternalApiOptions>>().Value;
    client.BaseAddress = new Uri(options.PokeApi.BaseUrl);
    client.DefaultRequestHeaders.Add("User-Agent", "PokeApiWrapper/1.0");
    client.Timeout = TimeSpan.FromSeconds(options.PokeApi.TimeoutSeconds);
})
.AddPolicyHandler(GetRetryPolicy())
.AddPolicyHandler(GetCircuitBreakerPolicy());

// Health Checks
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy("Wrapper API is running"))
    .AddCheck<RabbitMQHealthCheck>("rabbitmq")
    .AddTypeActivatedCheck<ExternalApiHealthCheck>(
        "external-pokeapi");

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Pokemon API Wrapper with RabbitMQ",
        Version = "v1",
        Description = "A professional wrapper API for the Pokemon API with RabbitMQ messaging, caching, resilience, and rate limiting",
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

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Pokemon API Wrapper with RabbitMQ V1");
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

Console.WriteLine("Wrapper API starting...");

app.Run();

// Stub RabbitMQ service for graceful degradation
public class StubRabbitMQService : IRabbitMQService
{
    private readonly ILogger _logger;

    public StubRabbitMQService(ILogger logger)
    {
        _logger = logger;
    }

    public void DeclareInfrastructure() { }

    public void Dispose() { }

    public Task<bool> IsHealthyAsync() => Task.FromResult(false);

    public Task<bool> PublishAsync<T>(string exchange, string routingKey, T message, string? correlationId = null, Dictionary<string, object>? headers = null, CancellationToken cancellationToken = default)
        => Task.FromResult(false);

    public Task<TResponse?> PublishAndWaitForReplyAsync<TRequest, TResponse>(string exchange, string routingKey, TRequest request, string replyQueue, TimeSpan timeout, string? correlationId = null, CancellationToken cancellationToken = default)
        => Task.FromResult<TResponse?>(default);

    public Task StartConsumingAsync<T>(string queueName, Func<MessageEnvelope<T>, Task<bool>> messageHandler, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task StopConsumingAsync(string queueName) => Task.CompletedTask;
}