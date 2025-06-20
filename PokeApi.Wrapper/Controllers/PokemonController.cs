using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Extensions;
using PokeApi.Shared.Middleware;
using PokeApi.Wrapper.Interfaces;
using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;
using static PokeApi.Shared.Models.PokemonModels;

namespace PokeApi.Wrapper.Controllers
{

    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [Produces("application/json")]
    public class PokemonController : ControllerBase
    {
        private readonly IPokeApiService _pokeApiService;
        private readonly ILogger<PokemonController> _logger;

        public PokemonController(IPokeApiService pokeApiService, ILogger<PokemonController> logger)
        {
            _pokeApiService = pokeApiService;
            _logger = logger;
        }

        /// <summary>
        /// Gets a paginated list of Pokemon from the external PokeAPI
        /// </summary>
        /// <param name="limit">Number of Pokemon to return (1-1000, default: 20)</param>
        /// <param name="offset">Number of Pokemon to skip (default: 0)</param>
        /// <returns>A paginated list of Pokemon with metadata</returns>
        /// <response code="200">Returns the Pokemon list successfully</response>
        /// <response code="400">Invalid parameters provided</response>
        /// <response code="429">Rate limit exceeded</response>
        /// <response code="500">Internal server error occurred</response>
        /// <response code="503">External service unavailable</response>
        [HttpGet]
        [SwaggerOperation(
            Summary = "Get Pokemon List",
            Description = "Retrieves a paginated list of Pokemon from the external PokeAPI with caching, resilience patterns, and detailed pagination metadata."
        )]
        [SwaggerResponse(200, "Pokemon list retrieved successfully", typeof(PaginatedResponseDTO<PokemonListResponse>))]
        [SwaggerResponse(400, "Invalid request parameters", typeof(PaginatedResponseDTO<PokemonListResponse>))]
        [SwaggerResponse(429, "Rate limit exceeded")]
        [SwaggerResponse(500, "Internal server error", typeof(PaginatedResponseDTO<PokemonListResponse>))]
        [SwaggerResponse(503, "External service unavailable", typeof(PaginatedResponseDTO<PokemonListResponse>))]
        public async Task<ActionResult<PaginatedResponseDTO<PokemonListResponse>>> GetPokemonList(
            [FromQuery]
        [PokemonLimit(1, 1000)]
        [SwaggerParameter("Number of Pokemon to return (1-1000)", Required = false)]
        int limit = 20,

            [FromQuery]
        [PokemonOffset]
        [SwaggerParameter("Number of Pokemon to skip", Required = false)]
        int offset = 0)
        {
            var correlationId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString();

            try
            {
                _logger.LogInformation("Pokemon list requested with limit: {Limit}, offset: {Offset}, correlationId: {CorrelationId}",
                    limit, offset, correlationId);

                // Validate model state
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage);

                    var errorResponse = new PaginatedResponseDTO<PokemonListResponse>
                    {
                        Success = false,
                        ErrorMessage = string.Join("; ", errors),
                        RequestId = correlationId,
                        Timestamp = DateTime.UtcNow
                    };

                    _logger.LogWarning("Invalid model state for Pokemon list request: {Errors}, correlationId: {CorrelationId}",
                        string.Join("; ", errors), correlationId);

                    return BadRequest(errorResponse);
                }

                var result = await _pokeApiService.GetPokemonList(limit, offset);
                result.RequestId = correlationId;

                if (result.Success)
                {
                    _logger.LogInformation("Pokemon list successfully retrieved from service, correlationId: {CorrelationId}", correlationId);

                    // Add cache headers safely (correlation ID already set by middleware)
                    Response.AddOrUpdateHeader("X-Cache-Status", result.Data != null ? "HIT" : "MISS");

                    return Ok(result);
                }
                else
                {
                    _logger.LogWarning("Pokemon list request failed: {Error}, correlationId: {CorrelationId}",
                        result.ErrorMessage, correlationId);

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
                _logger.LogError(ex, "Unexpected error in GetPokemonList endpoint, correlationId: {CorrelationId}", correlationId);

                var errorResponse = new PaginatedResponseDTO<PokemonListResponse>
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
        /// Health check endpoint for the Pokemon wrapper service
        /// </summary>
        /// <returns>Service health status with detailed information</returns>
        [HttpGet("health")]
        [SwaggerOperation(Summary = "Health Check", Description = "Returns the detailed health status of the Pokemon wrapper service")]
        [SwaggerResponse(200, "Service is healthy")]
        [SwaggerResponse(503, "Service is unhealthy")]
        public async Task<IActionResult> Health()
        {
            try
            {
                // Perform a lightweight test
                var testResult = await _pokeApiService.GetPokemonList(1, 0);

                var healthStatus = new
                {
                    Status = testResult.Success ? "Healthy" : "Degraded",
                    Timestamp = DateTime.UtcNow,
                    Service = "Pokemon API Wrapper",
                    Version = "1.0",
                    Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
                    ExternalApiStatus = testResult.Success ? "Available" : "Unavailable",
                    CacheStatus = "Available",
                    RequestId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString()
                };

                return testResult.Success ? Ok(healthStatus) : StatusCode(503, healthStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed");

                var healthStatus = new
                {
                    Status = "Unhealthy",
                    Timestamp = DateTime.UtcNow,
                    Service = "Pokemon API Wrapper",
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
                ApiName = "Pokemon API Wrapper",
                Version = "1.0",
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
                Timestamp = DateTime.UtcNow,
                Features = new[]
                {
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
                    Pokemon = "/api/v1/pokemon",
                    Health = "/api/v1/pokemon/health",
                    Info = "/api/v1/pokemon/info"
                },
                Documentation = "/swagger",
                RequestId = HttpContext.Items["CorrelationId"]?.ToString() ?? Guid.NewGuid().ToString()
            };

            return Ok(apiInfo);
        }
    }
}