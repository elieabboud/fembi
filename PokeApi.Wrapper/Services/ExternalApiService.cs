using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Interfaces;
using PokeApi.Shared.Models;
using System.Text.Json;

namespace PokeApi.Wrapper.Services
{
    public class ExternalApiService : IExternalApiService
    {
        private readonly IApiHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _cache;
        private readonly ILogger<ExternalApiService> _logger;
        private readonly ExternalApiOptions _options;
        private readonly JsonSerializerOptions _jsonOptions;

        public ExternalApiService(
            IApiHttpClientFactory httpClientFactory,
            IMemoryCache cache,
            ILogger<ExternalApiService> logger,
            IOptions<ExternalApiOptions> options)
        {
            _httpClientFactory = httpClientFactory;
            _cache = cache;
            _logger = logger;
            _options = options.Value;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
        }

        public async Task<PaginatedResponseDTO<object>> GetDataAsync(string source, int limit, int offset)
        {
            var cacheKey = $"{source}:{limit}:{offset}";

            try
            {
                // Check cache first
                if (_cache.TryGetValue(cacheKey, out PaginatedResponseDTO<object>? cachedResult) && cachedResult != null)
                {
                    _logger.LogInformation("Cache hit for {Source} request: limit={Limit}, offset={Offset}", source, limit, offset);
                    return cachedResult;
                }

                _logger.LogInformation("Cache miss for {Source} request: limit={Limit}, offset={Offset}", source, limit, offset);

                var apiOptions = _options.GetOptions(source);
                var httpClient = _httpClientFactory.CreateClient(source);
                var endpoint = apiOptions.GetEndpoint(limit, offset);

                _logger.LogInformation("Calling external API: {Source} - {BaseUrl}{Endpoint}",
                    source, apiOptions.BaseUrl, endpoint);

                var response = await httpClient.GetAsync(endpoint);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();

                    if (string.IsNullOrEmpty(content))
                    {
                        _logger.LogWarning("Empty response from {Source} API", source);
                        return CreateErrorResponse($"Empty response from {source} API");
                    }

                    var result = await ProcessApiResponse(source, content, limit, offset, apiOptions.BaseUrl);

                    // Cache the result
                    var cacheExpiration = TimeSpan.FromMinutes(apiOptions.CacheExpirationMinutes);
                    _cache.Set(cacheKey, result, cacheExpiration);

                    _logger.LogInformation("Successfully retrieved and cached {Source} data: limit={Limit}, offset={Offset}",
                        source, limit, offset);

                    return result;
                }
                else
                {
                    var errorMessage = $"{source} API returned {response.StatusCode}: {response.ReasonPhrase}";
                    _logger.LogError("External API error: {ErrorMessage}", errorMessage);
                    return CreateErrorResponse(errorMessage);
                }
            }
            catch (HttpRequestException ex)
            {
                var errorMessage = $"Network error calling {source} API: {ex.Message}";
                _logger.LogError(ex, "Network error for {Source} API", source);
                return CreateErrorResponse(errorMessage);
            }
            catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
            {
                var errorMessage = $"Timeout calling {source} API";
                _logger.LogError(ex, "Timeout for {Source} API", source);
                return CreateErrorResponse(errorMessage);
            }
            catch (JsonException ex)
            {
                var errorMessage = $"JSON parsing error from {source} API";
                _logger.LogError(ex, "JSON parsing error for {Source} API", source);
                return CreateErrorResponse(errorMessage);
            }
            catch (Exception ex)
            {
                var errorMessage = $"Unexpected error calling {source} API: {ex.Message}";
                _logger.LogError(ex, "Unexpected error for {Source} API", source);
                return CreateErrorResponse(errorMessage);
            }
        }

        private async Task<PaginatedResponseDTO<object>> ProcessApiResponse(
            string source,
            string content,
            int limit,
            int offset,
            string baseUrl)
        {
            try
            {
                object? data = null;
                PaginationMetadata pagination;

                switch (source.ToLowerInvariant())
                {
                    case ApiSources.Pokemon:
                        var pokemonResponse = JsonSerializer.Deserialize<PokemonListResponse>(content, _jsonOptions);
                        if (pokemonResponse != null)
                        {
                            data = pokemonResponse.Results;
                            pagination = PaginationMetadata.Create(
                                pokemonResponse.Count,
                                limit,
                                offset,
                                $"{baseUrl}pokemon"
                            );
                        }
                        else
                        {
                            return CreateErrorResponse("Failed to deserialize Pokemon API response");
                        }
                        break;

                    case ApiSources.Product:
                        var productResponse = JsonSerializer.Deserialize<ProductListResponse>(content, _jsonOptions);
                        if (productResponse != null)
                        {
                            data = productResponse.Products;
                            pagination = PaginationMetadata.Create(
                                productResponse.Total,
                                limit,
                                offset,
                                $"{baseUrl}products"
                            );
                        }
                        else
                        {
                            return CreateErrorResponse("Failed to deserialize Product API response");
                        }
                        break;

                    default:
                        return CreateErrorResponse($"Unknown API source: {source}");
                }

                return new PaginatedResponseDTO<object>
                {
                    Data = data,
                    Pagination = pagination,
                    Success = true,
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing {Source} API response", source);
                return CreateErrorResponse($"Error processing {source} API response");
            }
        }

        private static PaginatedResponseDTO<object> CreateErrorResponse(string errorMessage)
        {
            return new PaginatedResponseDTO<object>
            {
                Success = false,
                ErrorMessage = errorMessage,
                Timestamp = DateTime.UtcNow,
                Pagination = new PaginationMetadata()
            };
        }
    }
}