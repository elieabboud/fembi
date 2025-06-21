using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Extensions;
using PokeApi.Shared.Interfaces;
using PokeApi.Shared.Middleware;
using PokeApi.Shared.Models;
using Swashbuckle.AspNetCore.Annotations;

namespace PokeApi.Wrapper.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [Produces("application/json")]
    public class ApiController : ControllerBase
    {
        private readonly IExternalApiService _externalApiService;
        private readonly ILogger<ApiController> _logger;

        public ApiController(IExternalApiService externalApiService, ILogger<ApiController> logger)
        {
            _externalApiService = externalApiService;
            _logger = logger;
        }

        /// <summary>
        /// Gets a paginated list of data from the specified external API
        /// </summary>
        /// <param name="source">Data source (pokemon or product)</param>
        /// <param name="limit">Number of items to return (1-1000, default: 20)</param>
        /// <param name="offset">Number of items to skip (default: 0)</param>
        /// <returns>A paginated list of data with metadata</returns>
        /// <response code="200">Returns the data list successfully</response>
        /// <response code="400">Invalid parameters provided</response>
        /// <response code="429">Rate limit exceeded</response>
        /// <response code="500">Internal server error occurred</response>
        /// <response code="503">External service unavailable</response>
        [HttpGet]
        [SwaggerOperation(
            Summary = "Get Data List",
            Description = "Retrieves a paginated list of data from the specified external API (Pokemon or Products) with caching, resilience patterns, and detailed pagination metadata."
        )]
        [SwaggerResponse(200, "Data list retrieved successfully", typeof(PaginatedResponseDTO<object>))]
        [SwaggerResponse(400, "Invalid request parameters", typeof(PaginatedResponseDTO<object>))]
        [SwaggerResponse(429, "Rate limit exceeded")]
        [SwaggerResponse(500, "Internal server error", typeof(PaginatedResponseDTO<object>))]
        [SwaggerResponse(503, "External service unavailable", typeof(PaginatedResponseDTO<object>))]
        public async Task<ActionResult<PaginatedResponseDTO<object>>> GetDataList(
            [FromQuery]
            [ApiSource]
            [SwaggerParameter("Data source (pokemon or product)", Required = true)]
            string source,

            [FromQuery]
            [ApiLimit(1, 1000)]
            [SwaggerParameter("Number of items to return (1-1000)", Required = false)]
            int limit = 20,

            [FromQuery]
            [ApiOffset]
            [SwaggerParameter("Number of items to skip", Required = false)]
            int offset = 0)
        {
            var correlationId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString();

            try
            {
                _logger.LogInformation("Data list requested from {Source} with limit: {Limit}, offset: {Offset}, correlationId: {CorrelationId}",
                    source, limit, offset, correlationId);

                // Validate model state
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage);

                    var errorResponse = new PaginatedResponseDTO<object>
                    {
                        Success = false,
                        ErrorMessage = string.Join("; ", errors),
                        RequestId = correlationId,
                        Timestamp = DateTime.UtcNow
                    };

                    _logger.LogWarning("Invalid model state for {Source} data request: {Errors}, correlationId: {CorrelationId}",
                        source, string.Join("; ", errors), correlationId);

                    return BadRequest(errorResponse);
                }

                var result = await _externalApiService.GetDataAsync(source, limit, offset);
                result.RequestId = correlationId;

                if (result.Success)
                {
                    _logger.LogInformation("{Source} data list successfully retrieved from service, correlationId: {CorrelationId}",
                        source, correlationId);

                    // Add cache headers safely
                    Response.AddOrUpdateHeader("X-Cache-Status", result.Data != null ? "HIT" : "MISS");
                    Response.AddOrUpdateHeader("X-Data-Source", source);

                    return Ok(result);
                }
                else
                {
                    _logger.LogWarning("{Source} data request failed: {Error}, correlationId: {CorrelationId}",
                        source, result.ErrorMessage, correlationId);

                    // Determine appropriate status code based on error type
                    if (result.ErrorMessage?.Contains("timeout", StringComparison.OrdinalIgnoreCase) == true ||
                        result.ErrorMessage?.Contains("network", StringComparison.OrdinalIgnoreCase) == true ||
                        result.ErrorMessage?.Contains("unreachable", StringComparison.OrdinalIgnoreCase) == true)
                    {
                        return StatusCode(503, result); // Service Unavailable
                    }

                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetDataList endpoint for {Source}, correlationId: {CorrelationId}",
                    source, correlationId);

                var errorResponse = new PaginatedResponseDTO<object>
                {
                    Success = false,
                    ErrorMessage = "An internal server error occurred",
                    RequestId = correlationId,
                    Timestamp = DateTime.UtcNow
                };

                return StatusCode(500, errorResponse);
            }
        }

        /// <summary>
        /// Health check endpoint for the API wrapper service
        /// </summary>
        /// <returns>Service health status with detailed information</returns>
        [HttpGet("health")]
        [SwaggerOperation(Summary = "Health Check", Description = "Returns the detailed health status of the API wrapper service")]
        [SwaggerResponse(200, "Service is healthy")]
        [SwaggerResponse(503, "Service is unhealthy")]
        public async Task<IActionResult> Health()
        {
            try
            {
                // Test both APIs
                var pokemonTest = await _externalApiService.GetDataAsync(ApiSources.Pokemon, 1, 0);
                var productTest = await _externalApiService.GetDataAsync(ApiSources.Product, 1, 0);

                var healthStatus = new
                {
                    Status = (pokemonTest.Success && productTest.Success) ? "Healthy" : "Degraded",
                    Timestamp = DateTime.UtcNow,
                    Service = "Multi-API Wrapper",
                    Version = "1.0",
                    Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
                    ExternalApis = new
                    {
                        Pokemon = pokemonTest.Success ? "Available" : "Unavailable",
                        Products = productTest.Success ? "Available" : "Unavailable"
                    },
                    CacheStatus = "Available",
                    RequestId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString()
                };

                var isHealthy = pokemonTest.Success && productTest.Success;
                return isHealthy ? Ok(healthStatus) : StatusCode(503, healthStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed");

                var healthStatus = new
                {
                    Status = "Unhealthy",
                    Timestamp = DateTime.UtcNow,
                    Service = "Multi-API Wrapper",
                    Version = "1.0",
                    Error = "Health check failed",
                    RequestId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString()
                };

                return StatusCode(503, healthStatus);
            }
        }

        /// <summary>
        /// Get API information and statistics
        /// </summary>
        /// <returns>API metadata and usage statistics</returns>
        [HttpGet("info")]
        [SwaggerOperation(Summary = "API Information", Description = "Returns API metadata and configuration information")]
        [SwaggerResponse(200, "API information retrieved successfully")]
        public IActionResult GetApiInfo()
        {
            var apiInfo = new
            {
                ApiName = "Multi-Source API Wrapper",
                Version = "1.0",
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
                Timestamp = DateTime.UtcNow,
                SupportedSources = ApiSources.ValidSources,
                Features = new[]
                {
                    "Multi-Source Support",
                    "Caching",
                    "Rate Limiting",
                    "Circuit Breaker",
                    "Retry Policies",
                    "Health Checks",
                    "Correlation Tracking",
                    "API Versioning"
                },
                Endpoints = new
                {
                    Data = "/api/v1/api?source={pokemon|product}",
                    Health = "/api/v1/api/health",
                    Info = "/api/v1/api/info"
                },
                Documentation = "/swagger",
                RequestId = HttpContext.Items["CorrelationId"]?.ToString() ?? Guid.NewGuid().ToString()
            };

            return Ok(apiInfo);
        }
    }
}