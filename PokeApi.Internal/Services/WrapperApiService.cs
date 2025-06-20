using PokeApi.Internal.Interfaces;
using PokeApi.Shared.DTO;
using System.Text.Json;
using static PokeApi.Shared.Models.PokemonModels;

namespace PokeApi.Internal.Services
{
    public class WrapperApiService : IWrapperApiService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<WrapperApiService> _logger;

        public WrapperApiService(HttpClient httpClient, ILogger<WrapperApiService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<ApiResponseDTO<PokemonListResponse>> GetPokemonFromWrapperAsync(int limit, int offset)
        {
            try
            {
                _logger.LogInformation("Calling wrapper API with limit: {Limit}, offset: {Offset}", limit, offset);

                var requestUri = $"api/v1/pokemon?limit={limit}&offset={offset}";
                var response = await _httpClient.GetAsync(requestUri);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var apiResponse = JsonSerializer.Deserialize<ApiResponseDTO<PokemonListResponse>>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (apiResponse?.Success == true)
                    {
                        _logger.LogInformation("Successfully received data from wrapper API");
                        return apiResponse;
                    }
                    else
                    {
                        _logger.LogWarning("Wrapper API returned unsuccessful response: {Error}", apiResponse?.ErrorMessage);
                        return new ApiResponseDTO<PokemonListResponse>
                        {
                            Success = false,
                            ErrorMessage = apiResponse?.ErrorMessage ?? "Unknown error from wrapper API"
                        };
                    }
                }
                else
                {
                    _logger.LogError("Wrapper API call failed with status code: {StatusCode}", response.StatusCode);
                    return new ApiResponseDTO<PokemonListResponse>
                    {
                        Success = false,
                        ErrorMessage = $"Wrapper API call failed with status code: {response.StatusCode}"
                    };
                }
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP request exception occurred while calling wrapper API");
                return new ApiResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = "Network error occurred while calling wrapper API"
                };
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "Request timeout occurred while calling wrapper API");
                return new ApiResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = "Request timeout occurred"
                };
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "JSON deserialization error occurred while processing wrapper API response");
                return new ApiResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = "Data format error occurred"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred while calling wrapper API");
                return new ApiResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = "An unexpected error occurred"
                };
            }
        }
    }
}
