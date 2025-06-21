using Microsoft.Extensions.Options;
using PokeApi.Internal.Interfaces;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Interfaces;
using PokeApi.Shared.Middleware;
using System.Text.Json;

namespace PokeApi.Internal.Services
{
    public class WrapperApiService : IWrapperApiService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<WrapperApiService> _logger;
        private readonly WrapperApiOptions _options;
        private readonly IApiMessageService _messageService;
        private readonly IRabbitMQService _rabbitMQService;
        private readonly bool _useMessaging;

        public WrapperApiService(
            HttpClient httpClient,
            ILogger<WrapperApiService> logger,
            IOptions<WrapperApiOptions> options,
            IApiMessageService messageService,
            IRabbitMQService rabbitMQService,
            IConfiguration configuration)
        {
            _httpClient = httpClient;
            _logger = logger;
            _options = options.Value;
            _messageService = messageService;
            _rabbitMQService = rabbitMQService;

            // Allow switching between HTTP and messaging via configuration
            _useMessaging = configuration.GetValue<bool>("UseMessaging", true);
        }

        public async Task<PaginatedResponseDTO<object>> GetDataFromWrapper(string source, int limit, int offset)
        {
            var requestId = Guid.NewGuid().ToString();

            // Check RabbitMQ health before attempting messaging
            var isRabbitMQHealthy = await _rabbitMQService.IsHealthyAsync();
            var shouldUseMessaging = _useMessaging && isRabbitMQHealthy;

            _logger.LogInformation("Processing {Source} request {RequestId}: UseMessaging={UseMessaging}, RabbitMQHealthy={RabbitMQHealthy}, WillUseMessaging={WillUseMessaging}",
                source, requestId, _useMessaging, isRabbitMQHealthy, shouldUseMessaging);

            if (shouldUseMessaging)
            {
                _logger.LogInformation("Using messaging for {Source} request, requestId: {RequestId}", source, requestId);

                try
                {
                    var result = await GetDataViaMessaging(source, limit, offset, requestId);
                    return result;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Messaging failed for {Source}, falling back to HTTP for requestId: {RequestId}", source, requestId);
                    // Fall through to HTTP fallback
                }
            }

            _logger.LogInformation("Using HTTP fallback for {Source} request, requestId: {RequestId}", source, requestId);
            return await GetDataViaHttpAsync(source, limit, offset, requestId);
        }

        public async Task<PaginatedResponseDTO<object>> GetDataViaMessaging(string source, int limit, int offset, string correlationId)
        {
            try
            {
                _logger.LogInformation("Attempting messaging request for {Source} with correlation: {CorrelationId}", source, correlationId);

                var result = await _messageService.RequestDataAsync(source, limit, offset, correlationId);

                if (result != null)
                {
                    _logger.LogInformation("Messaging request successful for {Source}, correlation: {CorrelationId}", source, correlationId);
                    return result;
                }
                else
                {
                    _logger.LogWarning("Messaging returned null for {Source}, correlation: {CorrelationId}", source, correlationId);
                    return CreateErrorResponse("No response from messaging service", correlationId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting {Source} data via messaging, correlationId: {CorrelationId}", source, correlationId);
                return CreateErrorResponse($"Messaging error: {ex.Message}", correlationId);
            }
        }

        private async Task<PaginatedResponseDTO<object>> GetDataViaHttpAsync(string source, int limit, int offset, string requestId)
        {
            try
            {
                _logger.LogInformation("Making HTTP call to wrapper API for {Source} with limit: {Limit}, offset: {Offset}, requestId: {RequestId}",
                    source, limit, offset, requestId);

                var requestUri = $"api/v1/api?source={source}&limit={limit}&offset={offset}";

                // Add correlation ID header
                _httpClient.DefaultRequestHeaders.Remove(CorrelationConstants.CorrelationIdHeader);
                _httpClient.DefaultRequestHeaders.Add(CorrelationConstants.CorrelationIdHeader, requestId);

                _logger.LogDebug("HTTP request URI: {BaseAddress}{RequestUri}", _httpClient.BaseAddress, requestUri);

                var response = await _httpClient.GetAsync(requestUri);

                _logger.LogInformation("HTTP response received for {Source}: {StatusCode}, requestId: {RequestId}",
                    source, response.StatusCode, requestId);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();

                    _logger.LogDebug("HTTP response content length for {Source}: {Length}, requestId: {RequestId}",
                        source, content?.Length ?? 0, requestId);

                    var apiResponse = JsonSerializer.Deserialize<PaginatedResponseDTO<object>>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (apiResponse?.Success == true)
                    {
                        _logger.LogInformation("Successfully received {Source} data from wrapper API via HTTP, requestId: {RequestId}",
                            source, requestId);

                        // Update request ID to maintain correlation
                        apiResponse.RequestId = requestId;

                        // Log cache status if available
                        if (response.Headers.TryGetValues("X-Cache-Status", out var cacheStatus))
                        {
                            _logger.LogInformation("Wrapper API cache status for {Source}: {CacheStatus}, requestId: {RequestId}",
                                source, cacheStatus.FirstOrDefault(), requestId);
                        }

                        return apiResponse;
                    }
                    else
                    {
                        _logger.LogWarning("Wrapper API returned unsuccessful response for {Source} via HTTP: {Error}, requestId: {RequestId}",
                            source, apiResponse?.ErrorMessage, requestId);

                        return new PaginatedResponseDTO<object>
                        {
                            Success = false,
                            ErrorMessage = apiResponse?.ErrorMessage ?? $"Unknown error from wrapper API for {source}",
                            RequestId = requestId,
                            Timestamp = DateTime.UtcNow
                        };
                    }
                }
                else
                {
                    _logger.LogError("Wrapper API HTTP call failed for {Source} with status code: {StatusCode}, reason: {ReasonPhrase}, requestId: {RequestId}",
                        source, response.StatusCode, response.ReasonPhrase, requestId);

                    var errorMessage = response.StatusCode switch
                    {
                        System.Net.HttpStatusCode.TooManyRequests => $"Rate limit exceeded on wrapper API for {source}",
                        System.Net.HttpStatusCode.ServiceUnavailable => $"Wrapper API is temporarily unavailable for {source}",
                        System.Net.HttpStatusCode.BadGateway => $"Wrapper API gateway error for {source}",
                        System.Net.HttpStatusCode.GatewayTimeout => $"Wrapper API timeout for {source}",
                        _ => $"Wrapper API call failed for {source} with status code: {response.StatusCode}"
                    };

                    return new PaginatedResponseDTO<object>
                    {
                        Success = false,
                        ErrorMessage = errorMessage,
                        RequestId = requestId,
                        Timestamp = DateTime.UtcNow
                    };
                }
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP request exception occurred while calling wrapper API for {Source}, requestId: {RequestId}", source, requestId);
                return new PaginatedResponseDTO<object>
                {
                    Success = false,
                    ErrorMessage = $"Network error occurred while calling wrapper API for {source}",
                    RequestId = requestId,
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
            {
                _logger.LogError(ex, "Request timeout occurred while calling wrapper API for {Source}, requestId: {RequestId}", source, requestId);
                return new PaginatedResponseDTO<object>
                {
                    Success = false,
                    ErrorMessage = $"Request timeout occurred for {source}",
                    RequestId = requestId,
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "JSON deserialization error occurred while processing wrapper API response for {Source}, requestId: {RequestId}", source, requestId);
                return new PaginatedResponseDTO<object>
                {
                    Success = false,
                    ErrorMessage = $"Data format error occurred for {source}",
                    RequestId = requestId,
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred while calling wrapper API for {Source}, requestId: {RequestId}", source, requestId);
                return new PaginatedResponseDTO<object>
                {
                    Success = false,
                    ErrorMessage = $"An unexpected error occurred for {source}",
                    RequestId = requestId,
                    Timestamp = DateTime.UtcNow
                };
            }
        }

        private static PaginatedResponseDTO<object> CreateErrorResponse(string errorMessage, string correlationId)
        {
            return new PaginatedResponseDTO<object>
            {
                Success = false,
                ErrorMessage = errorMessage,
                RequestId = correlationId,
                Timestamp = DateTime.UtcNow,
                Pagination = new PaginationMetadata()
            };
        }
    }
}