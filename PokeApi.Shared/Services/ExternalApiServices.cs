using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Interfaces;
using PokeApi.Shared.Models;
using System.Text.Json;

namespace PokeApi.Shared.Services
{
    /// <summary>
    /// HTTP Client Factory implementation following the HTTP Client Factory pattern
    /// </summary>
    public class ExternalApiClientFactory : IExternalApiClientFactory
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public ExternalApiClientFactory(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        public HttpClient CreatePokemonClient() => _httpClientFactory.CreateClient("PokemonApi");
        public HttpClient CreateProductClient() => _httpClientFactory.CreateClient("ProductApi");
    }

    /// <summary>
    /// Pokemon API service implementation
    /// </summary>
    public class PokemonApiService : IPokemonApiService
    {
        private readonly IExternalApiClientFactory _clientFactory;
        private readonly ILogger<PokemonApiService> _logger;
        private readonly IMemoryCache _cache;
        private readonly PokeApiOptions _options;

        public PokemonApiService(
            IExternalApiClientFactory clientFactory,
            ILogger<PokemonApiService> logger,
            IMemoryCache cache,
            IOptions<ExternalApiOptions> options)
        {
            _clientFactory = clientFactory;
            _logger = logger;
            _cache = cache;
            _options = options.Value.PokeApi;
        }

        public async Task<PaginatedResponseDTO<PokemonModels.PokemonListResponse>> GetPokemonListAsync(int limit, int offset)
        {
            var cacheKey = $"pokemon_{limit}_{offset}";
            var requestId = Guid.NewGuid().ToString();

            try
            {
                // Check cache first
                if (_cache.TryGetValue(cacheKey, out PaginatedResponseDTO<PokemonModels.PokemonListResponse>? cachedResult) && cachedResult != null)
                {
                    _logger.LogInformation("Pokemon cache hit for key: {CacheKey}", cacheKey);
                    cachedResult.RequestId = requestId;
                    return cachedResult;
                }

                _logger.LogInformation("Fetching Pokemon data: limit={Limit}, offset={Offset}", limit, offset);

                using var client = _clientFactory.CreatePokemonClient();
                var response = await client.GetAsync($"pokemon?limit={limit}&offset={offset}");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var pokemonData = JsonSerializer.Deserialize<PokemonModels.PokemonListResponse>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (pokemonData != null)
                    {
                        var baseUrl = "/api/v1/data";
                        var pagination = PaginationMetadata.Create(pokemonData.Count, limit, offset, baseUrl);

                        var result = new PaginatedResponseDTO<PokemonModels.PokemonListResponse>
                        {
                            Success = true,
                            Data = pokemonData,
                            Pagination = pagination,
                            RequestId = requestId,
                            Timestamp = DateTime.UtcNow
                        };

                        // Cache the result
                        var cacheExpiry = TimeSpan.FromMinutes(_options.CacheExpirationMinutes);
                        _cache.Set(cacheKey, result, cacheExpiry);

                        _logger.LogInformation("Successfully fetched {Count} Pokemon records", pokemonData.Results?.Count ?? 0);
                        return result;
                    }
                }

                _logger.LogError("Pokemon API returned status: {StatusCode}", response.StatusCode);
                return CreateErrorResponse<PokemonModels.PokemonListResponse>($"Pokemon API error: {response.StatusCode}", requestId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching Pokemon data");
                return CreateErrorResponse<PokemonModels.PokemonListResponse>("Failed to fetch Pokemon data", requestId);
            }
        }

        private static PaginatedResponseDTO<T> CreateErrorResponse<T>(string error, string requestId)
        {
            return new PaginatedResponseDTO<T>
            {
                Success = false,
                ErrorMessage = error,
                RequestId = requestId,
                Timestamp = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Product API service implementation
    /// </summary>
    public class ProductApiService : IProductApiService
    {
        private readonly IExternalApiClientFactory _clientFactory;
        private readonly ILogger<ProductApiService> _logger;
        private readonly IMemoryCache _cache;
        private readonly DummyJsonOptions _options;

        public ProductApiService(
            IExternalApiClientFactory clientFactory,
            ILogger<ProductApiService> logger,
            IMemoryCache cache,
            IOptions<ExternalApiOptions> options)
        {
            _clientFactory = clientFactory;
            _logger = logger;
            _cache = cache;
            _options = options.Value.DummyJson;
        }

        public async Task<PaginatedResponseDTO<ProductModels.ProductListResponse>> GetProductListAsync(int limit, int skip)
        {
            var cacheKey = $"products_{limit}_{skip}";
            var requestId = Guid.NewGuid().ToString();

            try
            {
                // Check cache first
                if (_cache.TryGetValue(cacheKey, out PaginatedResponseDTO<ProductModels.ProductListResponse>? cachedResult) && cachedResult != null)
                {
                    _logger.LogInformation("Product cache hit for key: {CacheKey}", cacheKey);
                    cachedResult.RequestId = requestId;
                    return cachedResult;
                }

                _logger.LogInformation("Fetching Product data: limit={Limit}, skip={Skip}", limit, skip);

                using var client = _clientFactory.CreateProductClient();
                var response = await client.GetAsync($"products?limit={limit}&skip={skip}");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var productData = JsonSerializer.Deserialize<ProductModels.ProductListResponse>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (productData != null)
                    {
                        var baseUrl = "/api/v1/data";
                        var pagination = PaginationMetadata.Create(productData.Total, limit, skip, baseUrl);

                        var result = new PaginatedResponseDTO<ProductModels.ProductListResponse>
                        {
                            Success = true,
                            Data = productData,
                            Pagination = pagination,
                            RequestId = requestId,
                            Timestamp = DateTime.UtcNow
                        };

                        // Cache the result
                        var cacheExpiry = TimeSpan.FromMinutes(_options.CacheExpirationMinutes);
                        _cache.Set(cacheKey, result, cacheExpiry);

                        _logger.LogInformation("Successfully fetched {Count} Product records", productData.Products?.Count ?? 0);
                        return result;
                    }
                }

                _logger.LogError("Product API returned status: {StatusCode}", response.StatusCode);
                return CreateErrorResponse<ProductModels.ProductListResponse>($"Product API error: {response.StatusCode}", requestId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching Product data");
                return CreateErrorResponse<ProductModels.ProductListResponse>("Failed to fetch Product data", requestId);
            }
        }

        private static PaginatedResponseDTO<T> CreateErrorResponse<T>(string error, string requestId)
        {
            return new PaginatedResponseDTO<T>
            {
                Success = false,
                ErrorMessage = error,
                RequestId = requestId,
                Timestamp = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Unified external API service that orchestrates Pokemon and Product services
    /// </summary>
    public class UnifiedExternalApiService : IExternalApiService
    {
        private readonly IPokemonApiService _pokemonService;
        private readonly IProductApiService _productService;
        private readonly ILogger<UnifiedExternalApiService> _logger;

        public UnifiedExternalApiService(
            IPokemonApiService pokemonService,
            IProductApiService productService,
            ILogger<UnifiedExternalApiService> logger)
        {
            _pokemonService = pokemonService;
            _productService = productService;
            _logger = logger;
        }

        public async Task<PaginatedResponseDTO<UnifiedResponse>> GetDataAsync(ExternalApiSource source, int limit, int offset)
        {
            var requestId = Guid.NewGuid().ToString();

            try
            {
                _logger.LogInformation("Fetching data from {Source}: limit={Limit}, offset={Offset}", source, limit, offset);

                switch (source)
                {
                    case ExternalApiSource.Pokemon:
                        var pokemonResult = await _pokemonService.GetPokemonListAsync(limit, offset);
                        return ConvertToUnifiedResponse(pokemonResult, source, requestId);

                    case ExternalApiSource.Product:
                        var productResult = await _productService.GetProductListAsync(limit, offset);
                        return ConvertToUnifiedResponse(productResult, source, requestId);

                    default:
                        _logger.LogError("Unsupported source: {Source}", source);
                        return new PaginatedResponseDTO<UnifiedResponse>
                        {
                            Success = false,
                            ErrorMessage = $"Unsupported source: {source}",
                            RequestId = requestId,
                            Timestamp = DateTime.UtcNow
                        };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in unified external API service");
                return new PaginatedResponseDTO<UnifiedResponse>
                {
                    Success = false,
                    ErrorMessage = "Internal error occurred",
                    RequestId = requestId,
                    Timestamp = DateTime.UtcNow
                };
            }
        }

        private static PaginatedResponseDTO<UnifiedResponse> ConvertToUnifiedResponse<T>(
            PaginatedResponseDTO<T> sourceResult,
            ExternalApiSource source,
            string requestId)
        {
            if (!sourceResult.Success || sourceResult.Data == null)
            {
                return new PaginatedResponseDTO<UnifiedResponse>
                {
                    Success = false,
                    ErrorMessage = sourceResult.ErrorMessage,
                    RequestId = requestId,
                    Timestamp = DateTime.UtcNow
                };
            }

            UnifiedResponse unifiedData;

            switch (source)
            {
                case ExternalApiSource.Pokemon when sourceResult.Data is PokemonModels.PokemonListResponse pokemon:
                    unifiedData = UnifiedResponse.FromPokemonResponse(pokemon,
                        sourceResult.Pagination?.PageSize ?? 20,
                        sourceResult.Pagination?.StartIndex - 1 ?? 0);
                    break;

                case ExternalApiSource.Product when sourceResult.Data is ProductModels.ProductListResponse products:
                    unifiedData = UnifiedResponse.FromProductResponse(products,
                        sourceResult.Pagination?.PageSize ?? 20,
                        sourceResult.Pagination?.StartIndex - 1 ?? 0);
                    break;

                default:
                    throw new InvalidOperationException($"Unsupported conversion from {typeof(T)} to UnifiedResponse for source {source}");
            }

            return new PaginatedResponseDTO<UnifiedResponse>
            {
                Success = true,
                Data = unifiedData,
                Pagination = sourceResult.Pagination,
                RequestId = requestId,
                Timestamp = DateTime.UtcNow
            };
        }
    }
}