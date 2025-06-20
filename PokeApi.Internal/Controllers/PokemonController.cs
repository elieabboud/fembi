using Microsoft.AspNetCore.Mvc;
using PokeApi.Internal.Interfaces;
using PokeApi.Shared.DTO;
using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;
using static PokeApi.Shared.Models.PokemonModels;

namespace PokeApi.Internal.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
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
        /// <response code="500">Internal server error occurred</response>
        /// <response code="502">Wrapper API error occurred</response>
        [HttpGet]
        [SwaggerOperation(
            Summary = "Get Pokemon List via Wrapper API",
            Description = "Retrieves a paginated list of Pokemon by calling the internal wrapper API with configurable limit and offset parameters."
        )]
        [SwaggerResponse(200, "Pokemon list retrieved successfully", typeof(ApiResponseDTO<PokemonListResponse>))]
        [SwaggerResponse(400, "Invalid request parameters", typeof(ApiResponseDTO<PokemonListResponse>))]
        [SwaggerResponse(500, "Internal server error", typeof(ApiResponseDTO<PokemonListResponse>))]
        [SwaggerResponse(502, "Wrapper API error", typeof(ApiResponseDTO<PokemonListResponse>))]
        public async Task<ActionResult<ApiResponseDTO<PokemonListResponse>>> GetPokemonList(
            [FromQuery]
        [Range(1, 1000, ErrorMessage = "Limit must be between 1 and 1000")]
        [SwaggerParameter("Number of Pokemon to return (1-1000)", Required = false)]
        int limit = 20,

            [FromQuery]
        [Range(0, int.MaxValue, ErrorMessage = "Offset must be non-negative")]
        [SwaggerParameter("Number of Pokemon to skip", Required = false)]
        int offset = 0)
        {
            try
            {
                _logger.LogInformation("Internal API: Pokemon list requested with limit: {Limit}, offset: {Offset}", limit, offset);

                // Validate model state
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage);

                    return BadRequest(new ApiResponseDTO<PokemonListResponse>
                    {
                        Success = false,
                        ErrorMessage = string.Join("; ", errors)
                    });
                }

                var result = await _wrapperApiService.GetPokemonFromWrapperAsync(limit, offset);

                if (result.Success)
                {
                    _logger.LogInformation("Internal API: Pokemon list successfully retrieved from wrapper");
                    return Ok(result);
                }
                else
                {
                    _logger.LogWarning("Internal API: Wrapper API request failed: {Error}", result.ErrorMessage);

                    // Return 502 Bad Gateway for wrapper API failures
                    if (result.ErrorMessage?.Contains("wrapper", StringComparison.OrdinalIgnoreCase) == true ||
                        result.ErrorMessage?.Contains("network", StringComparison.OrdinalIgnoreCase) == true)
                    {
                        return StatusCode(502, result);
                    }

                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal API: Unexpected error in GetPokemonList endpoint");
                return StatusCode(500, new ApiResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = "An internal server error occurred"
                });
            }
        }

        /// <summary>
        /// Health check endpoint for the internal Pokemon service
        /// </summary>
        /// <returns>Service health status</returns>
        [HttpGet("health")]
        [SwaggerOperation(Summary = "Health Check", Description = "Returns the health status of the internal Pokemon service")]
        [SwaggerResponse(200, "Service is healthy")]
        public IActionResult Health()
        {
            return Ok(new
            {
                Status = "Healthy",
                Timestamp = DateTime.UtcNow,
                Service = "Pokemon Internal API",
                WrapperApiUrl = _wrapperApiService.GetType().Name
            });
        }
    }
}
