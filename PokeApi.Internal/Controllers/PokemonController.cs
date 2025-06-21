using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using PokeApi.Internal.Interfaces;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Extensions;
using PokeApi.Shared.Middleware;
using Swashbuckle.AspNetCore.Annotations;
using static PokeApi.Shared.Models.PokemonModels;

namespace PokeApi.Internal.Controllers
{

    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [Produces("application/json")]
    public class PokemonController : ControllerBase
    {
        private readonly IWrapperApiService _wrapperApiService;
        private readonly ILogger<PokemonController> _logger;

        public PokemonController(IWrapperApiService wrapperApiService, ILogger<PokemonController> logger)
        {
            _wrapperApiService = wrapperApiService;
            _logger = logger;
        }

        /// <summary>
        /// Gets a paginated list of Pokemon through the wrapper API
        /// </summary>
        /// <param name="limit">Number of Pokemon to return (1-1000, default: 20)</param>
        /// <param name="offset">Number of Pokemon to skip (default: 0)</param>
        /// <returns>A paginated list of Pokemon from the wrapper API</returns>
        /// <response code="200">Returns the Pokemon list successfully</response>
        /// <response code="400">Invalid parameters provided</response>
        /// <response code="429">Rate limit exceeded</response>
        /// <response code="500">Internal server error occurred</response>
        /// <response code="502">Wrapper API error occurred</response>
        /// <response code="503">Service unavailable</response>
        [HttpGet]
        [SwaggerOperation(
            Summary = "Get Pokemon List via Wrapper API",
            Description = "Retrieves a paginated list of Pokemon by calling the internal wrapper API with configurable limit and offset parameters. Includes correlation tracking and detailed error handling."
        )]
        [SwaggerResponse(200, "Pokemon list retrieved successfully", typeof(PaginatedResponseDTO<PokemonListResponse>))]
        [SwaggerResponse(400, "Invalid request parameters", typeof(PaginatedResponseDTO<PokemonListResponse>))]
        [SwaggerResponse(429, "Rate limit exceeded")]
        [SwaggerResponse(500, "Internal server error", typeof(PaginatedResponseDTO<PokemonListResponse>))]
        [SwaggerResponse(502, "Wrapper API error", typeof(PaginatedResponseDTO<PokemonListResponse>))]
        [SwaggerResponse(503, "Service unavailable", typeof(PaginatedResponseDTO<PokemonListResponse>))]
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
                _logger.LogInformation("Internal API: Pokemon list requested with limit: {Limit}, offset: {Offset}, correlationId: {CorrelationId}",
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

                    _logger.LogWarning("Internal API: Invalid model state: {Errors}, correlationId: {CorrelationId}",
                        string.Join("; ", errors), correlationId);

                    return BadRequest(errorResponse);
                }

                var result = await _wrapperApiService.GetPokemonFromWrapper(limit, offset);
                result.RequestId = correlationId;

                if (result.Success)
                {
                    _logger.LogInformation("Internal API: Pokemon list successfully retrieved from wrapper, correlationId: {CorrelationId}", correlationId);

                    // Add safe headers (correlation ID already set by middleware)
                    Response.TryAddHeader("X-Internal-API", "PokeApi.Internal");

                    return Ok(result);
                }
                else
                {
                    _logger.LogWarning("Internal API: Wrapper API request failed: {Error}, correlationId: {CorrelationId}",
                        result.ErrorMessage, correlationId);

                    // Determine appropriate status code based on error type
                    var statusCode = DetermineStatusCode(result.ErrorMessage);
                    return StatusCode(statusCode, result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal API: Unexpected error in GetPokemonList endpoint, correlationId: {CorrelationId}", correlationId);

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
        /// Health check endpoint for the internal Pokemon service
        /// </summary>
        /// <returns>Service health status with wrapper API connectivity</returns>
        [HttpGet("health")]
        [SwaggerOperation(Summary = "Health Check", Description = "Returns the health status of the internal Pokemon service and wrapper API connectivity")]
        [SwaggerResponse(200, "Service is healthy")]
        [SwaggerResponse(503, "Service is unhealthy")]
        public async Task<IActionResult> Health()
        {
            var correlationId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString();

            try
            {
                // Test wrapper API connectivity
                var testResult = await _wrapperApiService.GetPokemonFromWrapper(1, 0);

                var healthStatus = new
                {
                    Status = testResult.Success ? "Healthy" : "Degraded",
                    Timestamp = DateTime.UtcNow,
                    Service = "Pokemon Internal API",
                    Version = "1.0",
                    Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
                    WrapperApiStatus = testResult.Success ? "Available" : "Unavailable",
                    WrapperApiUrl = _wrapperApiService.GetType().Name,
                    RequestId = correlationId
                };

                _logger.LogInformation("Internal API: Health check performed, status: {Status}, correlationId: {CorrelationId}",
                    healthStatus.Status, correlationId);

                return testResult.Success ? Ok(healthStatus) : StatusCode(503, healthStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal API: Health check failed, correlationId: {CorrelationId}", correlationId);

                var healthStatus = new
                {
                    Status = "Unhealthy",
                    Timestamp = DateTime.UtcNow,
                    Service = "Pokemon Internal API",
                    Version = "1.0",
                    Error = "Health check failed",
                    RequestId = correlationId
                };

                return StatusCode(503, healthStatus);
            }
        }

        /// <summary>
        /// Get API information and statistics
        /// </summary>
        /// <returns>API metadata and configuration information</returns>
        [HttpGet("info")]
        [SwaggerOperation(Summary = "API Information", Description = "Returns API metadata and configuration information")]
        [SwaggerResponse(200, "API information retrieved successfully")]
        public IActionResult GetApiInfo()
        {
            var correlationId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString();

            var apiInfo = new
            {
                ApiName = "Pokemon Internal API",
                Version = "1.0",
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
                Timestamp = DateTime.UtcNow,
                Features = new[]
                {
                "Wrapper API Integration",
                "Correlation Tracking",
                "Error Handling",
                "Health Monitoring",
                "API Versioning",
                "Rate Limiting"
            },
                Endpoints = new
                {
                    Pokemon = "/api/v1/pokemon",
                    Health = "/api/v1/pokemon/health",
                    Info = "/api/v1/pokemon/info"
                },
                Documentation = "/swagger",
                RequestId = correlationId
            };

            return Ok(apiInfo);
        }

        private static int DetermineStatusCode(string? errorMessage)
        {
            if (string.IsNullOrEmpty(errorMessage))
                return 500;

            return errorMessage.ToLowerInvariant() switch
            {
                var msg when msg.Contains("rate limit") => 429,
                var msg when msg.Contains("timeout") || msg.Contains("network") => 502,
                var msg when msg.Contains("unavailable") || msg.Contains("unreachable") => 503,
                var msg when msg.Contains("wrapper") => 502,
                _ => 400
            };
        }
    }
}