using PokeApi.Shared.DTO;
using PokeApi.Shared.Interfaces;
using PokeApi.Wrapper.Interfaces;
using System.Text.Json;
using static PokeApi.Shared.Models.PokemonModels;

namespace PokeApi.Wrapper.Services
{
    public class PokeApiService : IPokeApiService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<PokeApiService> _logger;

        public PokeApiService(HttpClient httpClient, ILogger<PokeApiService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<ApiResponseDTO<PokemonListResponse>> GetPokemonList(int limit, int offset)
        {
            try
            {
                _logger.LogInformation("Fetching Pokemon list with limit: {Limit}, offset: {Offset}", limit, offset);

                // Validate parameters
                if (limit <= 0 || limit > 1000)
                {
                    return new ApiResponseDTO<PokemonListResponse>
                    {
                        Success = false,
                        ErrorMessage = "Limit must be between 1 and 1000"
                    };
                }

                if (offset < 0)
                {
                    return new ApiResponseDTO<PokemonListResponse>
                    {
                        Success = false,
                        ErrorMessage = "Offset must be non-negative"
                    };
                }

                var requestUri = $"pokemon?limit={limit}&offset={offset}";
                var response = await _httpClient.GetAsync(requestUri);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var pokemonData = JsonSerializer.Deserialize<PokemonListResponse>(content);

                    _logger.LogInformation("Successfully fetched {Count} Pokemon records", pokemonData?.Results?.Count ?? 0);

                    return new ApiResponseDTO<PokemonListResponse>
                    {
                        Success = true,
                        Data = pokemonData
                    };
                }
                else
                {
                    _logger.LogError("External API call failed with status code: {StatusCode}", response.StatusCode);
                    return new ApiResponseDTO<PokemonListResponse>
                    {
                        Success = false,
                        ErrorMessage = $"External API call failed with status code: {response.StatusCode}"
                    };
                }
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP request exception occurred while fetching Pokemon data");
                return new ApiResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = "Network error occurred while fetching data"
                };
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "Request timeout occurred while fetching Pokemon data");
                return new ApiResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = "Request timeout occurred"
                };
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "JSON deserialization error occurred");
                return new ApiResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = "Data format error occurred"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred while fetching Pokemon data");
                return new ApiResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = "An unexpected error occurred"
                };
            }
        }
    }
}
