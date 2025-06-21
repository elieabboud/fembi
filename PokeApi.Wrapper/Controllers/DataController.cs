using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Extensions;
using PokeApi.Shared.Interfaces;
using PokeApi.Shared.Middleware;
using PokeApi.Shared.Models;
using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;

namespace PokeApi.Wrapper.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [Produces("application/json")]
    public class DataController : ControllerBase
    {
        private readonly IExternalApiService _externalApiService;
        private readonly ILogger<DataController> _logger;

        public DataController(IExternalApiService externalApiService, ILogger<DataController> logger)
        {
            _externalApiService = externalApiService;
            _logger = logger;
        }

        /// <summary>
        /// Gets a paginated list of data from external APIs (Pokemon or Products)
        /// </summary>
        /// <param name="source">Data source: pokemon or product</param>
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
            Summary = "Get Data List from External APIs",
            Description = "Retrieves a paginated list of data from external APIs (Pokemon or Products) with caching, resilience patterns, and detailed pagination metadata."
        )]
        [SwaggerResponse(200, "Data list retrieved successfully", typeof(PaginatedResponseDTO<UnifiedResponse>))]
        [SwaggerResponse(400, "Invalid request parameters", typeof(PaginatedResponseDTO<UnifiedResponse>))]
        [SwaggerResponse(429, "Rate limit exceeded")]
        [SwaggerResponse(500, "Internal server error", typeof(PaginatedResponseDTO<UnifiedResponse>))]
        [SwaggerResponse(503, "External service unavailable", typeof(PaginatedResponseDTO<UnifiedResponse>))]
        public async Task<ActionResult<PaginatedResponseDTO<UnifiedResponse>>> GetDataList(
            [FromQuery]
            [Required]
            [SwaggerParameter("Data source: pokemon or product", Required = true)]
            string source,

            [FromQuery]
            [PokemonLimit(1, 1000)]
            [SwaggerParameter("Number of items to return (1-1000)", Required = false)]
            int limit = 20,

            [FromQuery]
            [PokemonOffset]
            [SwaggerParameter("Number of items to skip", Required = false)]
            int offset = 0)
        {
            var correlationId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString();

            try
            {
                _logger.LogInformation("Data list requested: source={Source}, limit={Limit}, offset={Offset}, correlationId={CorrelationId}",
                    source, limit, offset, correlationId);

                // Validate and parse source parameter
                if (!Enum.TryParse<ExternalApiSource>(source, true, out var apiSource))
                {
                    var errorResponse = new PaginatedResponseDTO<UnifiedResponse>
                    {
                        Success = false,
                        ErrorMessage = $"Invalid source parameter. Supported values: {string.Join(", ", Enum.GetNames<ExternalApiSource>())}",
                        RequestId = correlationId,
                        Timestamp = DateTime.UtcNow
                    };

                    _logger.LogWarning("Invalid source parameter: {Source}, correlationId: {CorrelationId}", source, correlationId);
                    return BadRequest(errorResponse);
                }

                // Validate model state
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage);

                    var errorResponse = new PaginatedResponseDTO<UnifiedResponse>
                    {
                        Success = false,
                        ErrorMessage = string.Join("; ", errors),
                        RequestId = correlationId,
                        Timestamp = DateTime.UtcNow
                    };

                    _logger.LogWarning("Invalid model state for data list request: {Errors}, correlationId: {CorrelationId}",
                        string.Join("; ", errors), correlationId);

                    return BadRequest(errorResponse);
                }

                var result = await _externalApiService.GetDataAsync(apiSource, limit, offset);
                result.RequestId = correlationId;

                if (result.Success)
                {
                    _logger.LogInformation("Data list successfully retrieved from {Source} service, correlationId: {CorrelationId}",
                        apiSource, correlationId);

                    // Add cache headers safely
                    Response.AddOrUpdateHeader("X-Cache-Status", result.Data != null ? "HIT" : "MISS");
                    Response.AddOrUpdateHeader("X-Data-Source", apiSource.ToString());

                    return Ok(result);
                }
                else
                {
                    _logger.LogWarning("Data list request failed for {Source}: {Error}, correlationId: {CorrelationId}",
                        apiSource, result.ErrorMessage, correlationId);

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
                _logger.LogError(ex, "Unexpected error in GetDataList endpoint, correlationId: {CorrelationId}", correlationId);

                var errorResponse = new PaginatedResponseDTO<UnifiedResponse>
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
        /// Health check endpoint for the data wrapper service
        /// </summary>
        /// <returns>Service health status with detailed information</returns>
        [HttpGet("health")]
        [SwaggerOperation(Summary = "Health Check", Description = "Returns the detailed health status of the data wrapper service")]
        [SwaggerResponse(200, "Service is healthy")]
        [SwaggerResponse(503, "Service is unhealthy")]
        public async Task<IActionResult> Health()
        {
            try
            {
                // Perform lightweight tests on both sources
                var pokemonTest = await _externalApiService.GetDataAsync(ExternalApiSource.Pokemon, 1, 0);
                var productTest = await _externalApiService.GetDataAsync(ExternalApiSource.Product, 1, 0);

                var healthStatus = new
                {
                    Status = (pokemonTest.Success && productTest.Success) ? "Healthy" : "Degraded",
                    Timestamp = DateTime.UtcNow,
                    Service = "Data API Wrapper",
                    Version = "1.0",
                    Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
                    ExternalApiStatus = new
                    {
                        Pokemon = pokemonTest.Success ? "Available" : "Unavailable",
                        Products = productTest.Success ? "Available" : "Unavailable"
                    },
                    CacheStatus = "Available",
                    RequestId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString()
                };

                return (pokemonTest.Success && productTest.Success) ? Ok(healthStatus) : StatusCode(503, healthStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed");

                var healthStatus = new
                {
                    Status = "Unhealthy",
                    Timestamp = DateTime.UtcNow,
                    Service = "Data API Wrapper",
                    Version = "1.0",
                    Error = "Health check failed",
                    RequestId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString()
                };

                return StatusCode(503, healthStatus);
            }
        }

        /// <summary>
        /// Get API information and supported data sources
        /// </summary>
        /// <returns>API metadata and configuration information</returns>
        [HttpGet("info")]
        [SwaggerOperation(Summary = "API Information", Description = "Returns API metadata and supported data sources")]
        [SwaggerResponse(200, "API information retrieved successfully")]
        public IActionResult GetApiInfo()
        {
            var apiInfo = new
            {
                ApiName = "Multi-Source Data API Wrapper",
                Version = "1.0",
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
                Timestamp = DateTime.UtcNow,
                SupportedSources = Enum.GetNames<ExternalApiSource>().Select(s => s.ToLower()).ToArray(),
                Features = new[]
                {
                    "Multi-Source Data Access",
                    "HTTP Client Factory Pattern",
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
                    Data = "/api/v1/data?source={pokemon|product}",
                    Health = "/api/v1/data/health",
                    Info = "/api/v1/data/info"
                },
                Documentation = "/swagger",
                RequestId = HttpContext.Items["CorrelationId"]?.ToString() ?? Guid.NewGuid().ToString()
            };

            return Ok(apiInfo);
        }
    }
}