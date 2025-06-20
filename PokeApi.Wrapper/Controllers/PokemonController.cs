using Microsoft.AspNetCore.Mvc;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Interfaces;
using PokeApi.Wrapper.Interfaces;
using PokeApi.Wrapper.Services;
using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;
using static PokeApi.Shared.Models.PokemonModels;

namespace PokeApi.Wrapper.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
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
        /// <returns>A paginated list of Pokemon</returns>
        /// <response code="200">Returns the Pokemon list successfully</response>
        /// <response code="400">Invalid parameters provided</response>
        /// <response code="500">Internal server error occurred</response>
        [HttpGet]
        [SwaggerOperation(
            Summary = "Get Pokemon List",
            Description = "Retrieves a paginated list of Pokemon from the external PokeAPI with configurable limit and offset parameters."
        )]
        [SwaggerResponse(200, "Pokemon list retrieved successfully", typeof(ApiResponseDTO<PokemonListResponse>))]
        [SwaggerResponse(400, "Invalid request parameters", typeof(ApiResponseDTO<PokemonListResponse>))]
        [SwaggerResponse(500, "Internal server error", typeof(ApiResponseDTO<PokemonListResponse>))]
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
                _logger.LogInformation("Pokemon list requested with limit: {Limit}, offset: {Offset}", limit, offset);

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

                var result = await _pokeApiService.GetPokemonList(limit, offset);

                if (result.Success)
                {
                    _logger.LogInformation("Pokemon list successfully retrieved");
                    return Ok(result);
                }
                else
                {
                    _logger.LogWarning("Pokemon list request failed: {Error}", result.ErrorMessage);
                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetPokemonList endpoint");
                return StatusCode(500, new ApiResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = "An internal server error occurred"
                });
            }
        }

        /// <summary>
        /// Health check endpoint for the Pokemon wrapper service
        /// </summary>
        /// <returns>Service health status</returns>
        [HttpGet("health")]
        [SwaggerOperation(Summary = "Health Check", Description = "Returns the health status of the Pokemon wrapper service")]
        [SwaggerResponse(200, "Service is healthy")]
        public IActionResult Health()
        {
            return Ok(new { Status = "Healthy", Timestamp = DateTime.UtcNow, Service = "Pokemon API Wrapper" });
        }
    }
}
