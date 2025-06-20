using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using PokeApi.Shared.Configurations;
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
        private readonly IMemoryCache _cache;
        private readonly PokeApiOptions _options;

        public PokeApiService(
            HttpClient httpClient,
            ILogger<PokeApiService> logger,
            IMemoryCache cache,
            IOptions<ExternalApiOptions> options)
        {
            _httpClient = httpClient;
            _logger = logger;
            _cache = cache;
            _options = options.Value.PokeApi;
        }

        public async Task<PaginatedResponseDTO<PokemonListResponse>> GetPokemonList(int limit, int offset)
        {
            var cacheKey = $"pokemon_list_{limit}_{offset}";
            var requestId = Guid.NewGuid().ToString();

            try
            {
                _logger.LogInformation("Fetching Pokemon list with limit: {Limit}, offset: {Offset}, requestId: {RequestId}",
                    limit, offset, requestId);

                // Try cache first
                if (_cache.TryGetValue(cacheKey, out PaginatedResponseDTO<PokemonListResponse>? cachedResult) && cachedResult != null)
                {
                    _logger.LogInformation("Cache hit for key: {CacheKey}, requestId: {RequestId}", cacheKey, requestId);
                    cachedResult.RequestId = requestId;
                    return cachedResult;
                }

                _logger.LogInformation("Cache miss for key: {CacheKey}, fetching from external API, requestId: {RequestId}",
                    cacheKey, requestId);

                // Validate parameters
                var validationResult = ValidateParameters(limit, offset);
                if (!validationResult.Success)
                {
                    return validationResult;
                }

                // Fetch from external API
                var result = await FetchFromExternalApi(limit, offset, requestId);

                // Cache successful results
                if (result.Success && result.Data != null)
                {
                    var cacheExpiration = TimeSpan.FromMinutes(_options.CacheExpirationMinutes);
                    _cache.Set(cacheKey, result, cacheExpiration);
                    _logger.LogInformation("Cached result for key: {CacheKey} with expiration: {Expiration}, requestId: {RequestId}",
                        cacheKey, cacheExpiration, requestId);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetPokemonList, requestId: {RequestId}", requestId);
                return new PaginatedResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = "An unexpected error occurred",
                    RequestId = requestId,
                    Timestamp = DateTime.UtcNow
                };
            }
        }
        
        private async Task<PaginatedResponseDTO<PokemonListResponse>> FetchFromExternalApi(int limit, int offset, string requestId)
        {
            try
            {
                var requestUri = $"pokemon?limit={limit}&offset={offset}";
                _logger.LogDebug("Making request to external API: {RequestUri}, requestId: {RequestId}", requestUri, requestId);

                var response = await _httpClient.GetAsync(requestUri);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var pokemonData = JsonSerializer.Deserialize<PokemonListResponse>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (pokemonData != null)
                    {
                        _logger.LogInformation("Successfully fetched {Count} Pokemon records from external API, requestId: {RequestId}",
                            pokemonData.Results?.Count ?? 0, requestId);

                        // Create pagination metadata
                        var baseUrl = "/api/v1/pokemon";
                        var pagination = PaginationMetadata.Create(pokemonData.Count, limit, offset, baseUrl);

                        return new PaginatedResponseDTO<PokemonListResponse>
                        {
                            Success = true,
                            Data = pokemonData,
                            Pagination = pagination,
                            RequestId = requestId,
                            Timestamp = DateTime.UtcNow
                        };
                    }
                }

                _logger.LogError("External API call failed with status code: {StatusCode}, requestId: {RequestId}",
                    response.StatusCode, requestId);

                return new PaginatedResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = $"External API call failed with status code: {response.StatusCode}",
                    RequestId = requestId,
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP request exception occurred while fetching Pokemon data, requestId: {RequestId}", requestId);
                return new PaginatedResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = "Network error occurred while fetching data",
                    RequestId = requestId,
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
            {
                _logger.LogError(ex, "Request timeout occurred while fetching Pokemon data, requestId: {RequestId}", requestId);
                return new PaginatedResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = "Request timeout occurred",
                    RequestId = requestId,
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "JSON deserialization error occurred, requestId: {RequestId}", requestId);
                return new PaginatedResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = "Data format error occurred",
                    RequestId = requestId,
                    Timestamp = DateTime.UtcNow
                };
            }
        }

        private static PaginatedResponseDTO<PokemonListResponse> ValidateParameters(int limit, int offset)
        {
            if (limit <= 0 || limit > 1000)
            {
                return new PaginatedResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = "Limit must be between 1 and 1000",
                    Timestamp = DateTime.UtcNow
                };
            }

            if (offset < 0)
            {
                return new PaginatedResponseDTO<PokemonListResponse>
                {
                    Success = false,
                    ErrorMessage = "Offset must be non-negative",
                    Timestamp = DateTime.UtcNow
                };
            }

            return new PaginatedResponseDTO<PokemonListResponse> { Success = true };
        }
    }
}
