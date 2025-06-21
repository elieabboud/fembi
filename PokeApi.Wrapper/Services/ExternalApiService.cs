using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Interfaces;
using PokeApi.Shared.Models;
using System.Diagnostics;
using System.Text.Json;
using static PokeApi.Shared.DTO.AuditMessagesDTO;

namespace PokeApi.Wrapper.Services
{
    public class ExternalApiService : IExternalApiService
    {
        private readonly IApiHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _cache;
        private readonly ILogger<ExternalApiService> _logger;
        private readonly ExternalApiOptions _options;
        private readonly IRabbitMQService _rabbitMQService;
        private readonly JsonSerializerOptions _jsonOptions;

        public ExternalApiService(
            IApiHttpClientFactory httpClientFactory,
            IMemoryCache cache,
            ILogger<ExternalApiService> logger,
            IOptions<ExternalApiOptions> options,
            IRabbitMQService rabbitMQService)
        {
            _httpClientFactory = httpClientFactory;
            _cache = cache;
            _logger = logger;
            _options = options.Value;
            _rabbitMQService = rabbitMQService;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
        }

        public async Task<PaginatedResponseDTO<object>> GetDataAsync(string source, int limit, int offset)
        {
            var cacheKey = $"external_api:{source}:{limit}:{offset}";
            var requestId = Guid.NewGuid().ToString();
            var correlationId = Activity.Current?.Id ?? Guid.NewGuid().ToString();
            var startTime = DateTime.UtcNow;
            var cacheHit = false;

            try
            {
                // Check cache first
                if (_cache.TryGetValue(cacheKey, out PaginatedResponseDTO<object>? cachedResult) && cachedResult != null)
                {
                    cacheHit = true;
                    var processingTime = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;

                    _logger.LogInformation("Cache hit for {Source} request: limit={Limit}, offset={Offset}, requestId={RequestId}",
                        source, limit, offset, requestId);

                    // Publish audit event for cache hit (async, don't await)
                    _ = PublishAuditEventAsync(requestId, correlationId, source, limit, offset, true,
                        cachedResult.Data, null, processingTime, null, cacheHit);

                    return cachedResult;
                }

                _logger.LogInformation("Cache miss for {Source} request: limit={Limit}, offset={Offset}, requestId={RequestId}",
                    source, limit, offset, requestId);

                var apiOptions = _options.GetOptions(source);
                var httpClient = _httpClientFactory.CreateClient(source);
                var endpoint = apiOptions.GetEndpoint(limit, offset);
                var externalApiUrl = $"{apiOptions.BaseUrl}{endpoint}";

                _logger.LogInformation("Calling external API: {Source} - {ExternalApiUrl}, requestId={RequestId}",
                    source, externalApiUrl, requestId);

                var response = await httpClient.GetAsync(endpoint);
                var processingTimeMs = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();

                    if (string.IsNullOrEmpty(content))
                    {
                        var errorMessage = $"Empty response from {source} API";
                        _logger.LogWarning("Empty response from {Source} API, requestId={RequestId}", source, requestId);

                        var errorResult = CreateErrorResponse(errorMessage);
                        _ = PublishAuditEventAsync(requestId, correlationId, source, limit, offset, false,
                            null, errorMessage, processingTimeMs, externalApiUrl, cacheHit);

                        return errorResult;
                    }

                    var result = await ProcessApiResponse(source, content, limit, offset, apiOptions.BaseUrl);

                    // Cache the result
                    var cacheExpiration = TimeSpan.FromMinutes(apiOptions.CacheExpirationMinutes);
                    _cache.Set(cacheKey, result, cacheExpiration);

                    _logger.LogInformation("Successfully retrieved and cached {Source} data: limit={Limit}, offset={Offset}, requestId={RequestId}",
                        source, limit, offset, requestId);

                    // Publish audit event for successful request (async, don't await)
                    _ = PublishAuditEventAsync(requestId, correlationId, source, limit, offset, true,
                        result.Data, null, processingTimeMs, externalApiUrl, cacheHit);

                    return result;
                }
                else
                {
                    var errorMessage = $"{source} API returned {response.StatusCode}: {response.ReasonPhrase}";
                    _logger.LogError("External API error: {ErrorMessage}, requestId={RequestId}", errorMessage, requestId);

                    var errorResult = CreateErrorResponse(errorMessage);
                    _ = PublishAuditEventAsync(requestId, correlationId, source, limit, offset, false,
                        null, errorMessage, processingTimeMs, externalApiUrl, cacheHit);

                    return errorResult;
                }
            }
            catch (HttpRequestException ex)
            {
                var errorMessage = $"Network error calling {source} API: {ex.Message}";
                var processingTimeMs = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;
                _logger.LogError(ex, "Network error for {Source} API, requestId={RequestId}", source, requestId);

                // Build the external API URL for audit logging
                var apiOptions = _options.GetOptions(source);
                var endpoint = apiOptions.GetEndpoint(limit, offset);
                var externalApiUrlForAudit = $"{apiOptions.BaseUrl}{endpoint}";

                _ = PublishAuditEventAsync(requestId, correlationId, source, limit, offset, false,
                    null, errorMessage, processingTimeMs, externalApiUrlForAudit, cacheHit);

                return CreateErrorResponse(errorMessage);
            }
            catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
            {
                var errorMessage = $"Timeout calling {source} API";
                var processingTimeMs = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;
                _logger.LogError(ex, "Timeout for {Source} API, requestId={RequestId}", source, requestId);

                // Build the external API URL for audit logging
                var apiOptions = _options.GetOptions(source);
                var endpoint = apiOptions.GetEndpoint(limit, offset);
                var externalApiUrlForAudit = $"{apiOptions.BaseUrl}{endpoint}";

                _ = PublishAuditEventAsync(requestId, correlationId, source, limit, offset, false,
                    null, errorMessage, processingTimeMs, externalApiUrlForAudit, cacheHit);

                return CreateErrorResponse(errorMessage);
            }
            catch (JsonException ex)
            {
                var errorMessage = $"JSON parsing error from {source} API";
                var processingTimeMs = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;
                _logger.LogError(ex, "JSON parsing error for {Source} API, requestId={RequestId}", source, requestId);

                // Build the external API URL for audit logging
                var apiOptions = _options.GetOptions(source);
                var endpoint = apiOptions.GetEndpoint(limit, offset);
                var externalApiUrlForAudit = $"{apiOptions.BaseUrl}{endpoint}";

                _ = PublishAuditEventAsync(requestId, correlationId, source, limit, offset, false,
                    null, errorMessage, processingTimeMs, externalApiUrlForAudit, cacheHit);

                return CreateErrorResponse(errorMessage);
            }
            catch (Exception ex)
            {
                var errorMessage = $"Unexpected error calling {source} API: {ex.Message}";
                var processingTimeMs = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;
                _logger.LogError(ex, "Unexpected error for {Source} API, requestId={RequestId}", source, requestId);

                // Build the external API URL for audit logging (may fail, so wrap in try-catch)
                string? externalApiUrlForAudit = null;
                try
                {
                    var apiOptions = _options.GetOptions(source);
                    var endpoint = apiOptions.GetEndpoint(limit, offset);
                    externalApiUrlForAudit = $"{apiOptions.BaseUrl}{endpoint}";
                }
                catch
                {
                    externalApiUrlForAudit = $"Error building URL for {source}";
                }

                _ = PublishAuditEventAsync(requestId, correlationId, source, limit, offset, false,
                    null, errorMessage, processingTimeMs, externalApiUrlForAudit, cacheHit);

                return CreateErrorResponse(errorMessage);
            }
        }

        private async Task PublishAuditEventAsync(string requestId, string correlationId, string source,
            int limit, int offset, bool success, object? responseData, string? errorMessage,
            int processingTimeMs, string? externalApiUrl, bool cacheHit)
        {
            try
            {
                var auditEvent = new AuditEventMessage
                {
                    RequestId = requestId,
                    CorrelationId = correlationId,
                    Source = source,
                    Limit = limit,
                    Offset = offset,
                    Success = success,
                    ResponseData = responseData,
                    ErrorMessage = errorMessage,
                    ProcessingTimeMs = processingTimeMs,
                    ExternalApiUrl = externalApiUrl,
                    CacheHit = cacheHit,
                    EventTimestamp = DateTime.UtcNow
                };

                var published = await _rabbitMQService.PublishAsync(
                    ExchangeNames.Audit,
                    RoutingKeys.AuditEvent,
                    auditEvent,
                    correlationId
                );

                if (published)
                {
                    _logger.LogDebug("Audit event published successfully: RequestId={RequestId}, Source={Source}, Success={Success}",
                        requestId, source, success);
                }
                else
                {
                    _logger.LogWarning("Failed to publish audit event: RequestId={RequestId}, Source={Source}",
                        requestId, source);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error publishing audit event: RequestId={RequestId}, Source={Source}",
                    requestId, source);
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