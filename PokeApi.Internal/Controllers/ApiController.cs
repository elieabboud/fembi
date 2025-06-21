using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using PokeApi.Internal.Interfaces;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Extensions;
using PokeApi.Shared.Middleware;
using PokeApi.Shared.Models;
using Swashbuckle.AspNetCore.Annotations;

namespace PokeApi.Internal.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [Produces("application/json")]
    public class ApiController : ControllerBase
    {
        private readonly IWrapperApiService _wrapperApiService;
        private readonly ILogger<ApiController> _logger;

        public ApiController(IWrapperApiService wrapperApiService, ILogger<ApiController> logger)
        {
            _wrapperApiService = wrapperApiService;
            _logger = logger;
        }

        /// <summary>
        /// Gets a paginated list of data from the specified source through the wrapper API
        /// </summary>
        /// <param name="source">Data source (pokemon or product)</param>
        /// <param name="limit">Number of items to return (1-1000, default: 20)</param>
        /// <param name="offset">Number of items to skip (default: 0)</param>
        /// <returns>A paginated list of data from the wrapper API</returns>
        /// <response code="200">Returns the data list successfully</response>
        /// <response code="400">Invalid parameters provided</response>
        /// <response code="429">Rate limit exceeded</response>
        /// <response code="500">Internal server error occurred</response>
        /// <response code="502">Wrapper API error occurred</response>
        /// <response code="503">Service unavailable</response>
        [HttpGet]
        [SwaggerOperation(
            Summary = "Get Data List via Wrapper API",
            Description = "Retrieves a paginated list of data from the specified source by calling the internal wrapper API with configurable limit and offset parameters. Includes correlation tracking and detailed error handling."
        )]
        [SwaggerResponse(200, "Data list retrieved successfully", typeof(PaginatedResponseDTO<object>))]
        [SwaggerResponse(400, "Invalid request parameters", typeof(PaginatedResponseDTO<object>))]
        [SwaggerResponse(429, "Rate limit exceeded")]
        [SwaggerResponse(500, "Internal server error", typeof(PaginatedResponseDTO<object>))]
        [SwaggerResponse(502, "Wrapper API error", typeof(PaginatedResponseDTO<object>))]
        [SwaggerResponse(503, "Service unavailable", typeof(PaginatedResponseDTO<object>))]
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
                _logger.LogInformation("Internal API: Data list requested from {Source} with limit: {Limit}, offset: {Offset}, correlationId: {CorrelationId}",
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

                    _logger.LogWarning("Internal API: Invalid model state: {Errors}, correlationId: {CorrelationId}",
                        string.Join("; ", errors), correlationId);

                    return BadRequest(errorResponse);
                }

                var result = await _wrapperApiService.GetDataFromWrapper(source, limit, offset);
                result.RequestId = correlationId;

                if (result.Success)
                {
                    _logger.LogInformation("Internal API: {Source} data list successfully retrieved from wrapper, correlationId: {CorrelationId}",
                        source, correlationId);

                    // Add safe headers
                    Response.TryAddHeader("X-Internal-API", "PokeApi.Internal");
                    Response.TryAddHeader("X-Data-Source", source);

                    return Ok(result);
                }
                else
                {
                    _logger.LogWarning("Internal API: Wrapper API request failed for {Source}: {Error}, correlationId: {CorrelationId}",
                        source, result.ErrorMessage, correlationId);

                    // Determine appropriate status code based on error type
                    var statusCode = DetermineStatusCode(result.ErrorMessage);
                    return StatusCode(statusCode, result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal API: Unexpected error in GetDataList endpoint for {Source}, correlationId: {CorrelationId}",
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
        /// Health check endpoint for the internal API service
        /// </summary>
        /// <returns>Service health status with wrapper API connectivity</returns>
        [HttpGet("health")]
        [SwaggerOperation(Summary = "Health Check", Description = "Returns the health status of the internal API service and wrapper API connectivity")]
        [SwaggerResponse(200, "Service is healthy")]
        [SwaggerResponse(503, "Service is unhealthy")]
        public async Task<IActionResult> Health()
        {
            var correlationId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString();

            try
            {
                // Test wrapper API connectivity with both sources
                var pokemonTest = await _wrapperApiService.GetDataFromWrapper(ApiSources.Pokemon, 1, 0);
                var productTest = await _wrapperApiService.GetDataFromWrapper(ApiSources.Product, 1, 0);

                var healthStatus = new
                {
                    Status = (pokemonTest.Success && productTest.Success) ? "Healthy" : "Degraded",
                    Timestamp = DateTime.UtcNow,
                    Service = "Multi-Source Internal API",
                    Version = "1.0",
                    Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
                    WrapperApiStatus = new
                    {
                        Pokemon = pokemonTest.Success ? "Available" : "Unavailable",
                        Products = productTest.Success ? "Available" : "Unavailable"
                    },
                    WrapperApiUrl = _wrapperApiService.GetType().Name,
                    RequestId = correlationId
                };

                _logger.LogInformation("Internal API: Health check performed, status: {Status}, correlationId: {CorrelationId}",
                    healthStatus.Status, correlationId);

                var isHealthy = pokemonTest.Success && productTest.Success;
                return isHealthy ? Ok(healthStatus) : StatusCode(503, healthStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal API: Health check failed, correlationId: {CorrelationId}", correlationId);

                var healthStatus = new
                {
                    Status = "Unhealthy",
                    Timestamp = DateTime.UtcNow,
                    Service = "Multi-Source Internal API",
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
                ApiName = "Multi-Source Internal API",
                Version = "1.0",
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
                Timestamp = DateTime.UtcNow,
                SupportedSources = ApiSources.ValidSources,
                Features = new[]
                {
                    "Multi-Source Support",
                    "Wrapper API Integration",
                    "Correlation Tracking",
                    "Error Handling",
                    "Health Monitoring",
                    "API Versioning",
                    "Rate Limiting"
                },
                Endpoints = new
                {
                    Data = "/api/v1/api?source={pokemon|product}",
                    Health = "/api/v1/api/health",
                    Info = "/api/v1/api/info"
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