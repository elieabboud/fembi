using Microsoft.Extensions.Options;
using PokeApi.Internal.Interfaces;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Interfaces;
using PokeApi.Shared.Middleware;
using System.Text.Json;
using static PokeApi.Shared.Models.PokemonModels;

namespace PokeApi.Internal.Services;

public class WrapperApiService : IWrapperApiService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WrapperApiService> _logger;
    private readonly WrapperApiOptions _options;
    private readonly IPokemonMessageService _messageService;
    private readonly bool _useMessaging;

    public WrapperApiService(
        HttpClient httpClient,
        ILogger<WrapperApiService> logger,
        IOptions<WrapperApiOptions> options,
        IPokemonMessageService messageService,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _options = options.Value;
        _messageService = messageService;

        // Allow switching between HTTP and messaging via configuration
        _useMessaging = configuration.GetValue<bool>("UseMessaging", true);
    }

    public async Task<PaginatedResponseDTO<PokemonListResponse>> GetPokemonFromWrapper(int limit, int offset)
    {
        var requestId = Guid.NewGuid().ToString();

        if (_useMessaging)
        {
            _logger.LogInformation("Using messaging for Pokemon request, requestId: {RequestId}", requestId);

            var result = await GetPokemonViaMessaging(limit, offset, requestId);
            return ConvertToTypedResponse(result);
        }
        else
        {
            _logger.LogInformation("Using HTTP for Pokemon request, requestId: {RequestId}", requestId);
            return await GetPokemonViaHttpAsync(limit, offset, requestId);
        }
    }

    public async Task<PaginatedResponseDTO<object>> GetPokemonViaMessaging(int limit, int offset, string correlationId)
    {
        try
        {
            var result = await _messageService.RequestPokemonDataAsync(limit, offset, correlationId);
            return result ?? CreateErrorResponse("No response from messaging service", correlationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Pokemon via messaging, correlationId: {CorrelationId}", correlationId);
            return CreateErrorResponse("Messaging error occurred", correlationId);
        }
    }

    private async Task<PaginatedResponseDTO<PokemonListResponse>> GetPokemonViaHttpAsync(int limit, int offset, string requestId)
    {
        try
        {
            _logger.LogInformation("Calling wrapper API with limit: {Limit}, offset: {Offset}, requestId: {RequestId}",
                limit, offset, requestId);

            var requestUri = $"api/v1/pokemon?limit={limit}&offset={offset}";

            // Add correlation ID header
            _httpClient.DefaultRequestHeaders.Remove(CorrelationConstants.CorrelationIdHeader);
            _httpClient.DefaultRequestHeaders.Add(CorrelationConstants.CorrelationIdHeader, requestId);

            var response = await _httpClient.GetAsync(requestUri);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var apiResponse = JsonSerializer.Deserialize<PaginatedResponseDTO<PokemonListResponse>>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (apiResponse?.Success == true)
                {
                    _logger.LogInformation("Successfully received data from wrapper API, requestId: {RequestId}", requestId);

                    // Update request ID to maintain correlation
                    apiResponse.RequestId = requestId;

                    // Log cache status if available
                    if (response.Headers.TryGetValues("X-Cache-Status", out var cacheStatus))
                    {
                        _logger.LogInformation("Wrapper API cache status: {CacheStatus}, requestId: {RequestId}",
                            cacheStatus.FirstOrDefault(), requestId);
                    }

                    return apiResponse;
                }
                else
                {
                    _logger.LogWarning("Wrapper API returned unsuccessful response: {Error}, requestId: {RequestId}",
                        apiResponse?.ErrorMessage, requestId);

                    return new PaginatedResponseDTO<PokemonListResponse>
                    {
                        Success = false,
                        ErrorMessage = apiResponse?.ErrorMessage ?? "Unknown error from wrapper API",
                        RequestId = requestId,
                        Timestamp = DateTime.UtcNow
                    };
                }
            }
            else
            {
                _logger.LogError("Wrapper API call failed with status code: {StatusCode}, reason: {ReasonPhrase}, requestId: {RequestId}",
                    response.StatusCode, response.ReasonPhrase, requestId);

                var errorMessage = response.StatusCode switch
                {
                    System.Net.HttpStatusCode.TooManyRequests => "Rate limit exceeded on wrapper API",
                    System.Net.HttpStatusCode.ServiceUnavailable => "Wrapper API is temporarily unavailable",
                    System.Net.HttpStatusCode.BadGateway => "Wrapper API gateway error",
                    System.Net.HttpStatusCode.GatewayTimeout => "Wrapper API timeout",
                    _ => $"Wrapper API call failed with status code: {response.StatusCode}"
                };

                return new PaginatedResponseDTO<PokemonListResponse>
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
            _logger.LogError(ex, "HTTP request exception occurred while calling wrapper API, requestId: {RequestId}", requestId);
            return new PaginatedResponseDTO<PokemonListResponse>
            {
                Success = false,
                ErrorMessage = "Network error occurred while calling wrapper API",
                RequestId = requestId,
                Timestamp = DateTime.UtcNow
            };
        }
        catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
        {
            _logger.LogError(ex, "Request timeout occurred while calling wrapper API, requestId: {RequestId}", requestId);
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
            _logger.LogError(ex, "JSON deserialization error occurred while processing wrapper API response, requestId: {RequestId}", requestId);
            return new PaginatedResponseDTO<PokemonListResponse>
            {
                Success = false,
                ErrorMessage = "Data format error occurred",
                RequestId = requestId,
                Timestamp = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred while calling wrapper API, requestId: {RequestId}", requestId);
            return new PaginatedResponseDTO<PokemonListResponse>
            {
                Success = false,
                ErrorMessage = "An unexpected error occurred",
                RequestId = requestId,
                Timestamp = DateTime.UtcNow
            };
        }
    }

    private static PaginatedResponseDTO<PokemonListResponse> ConvertToTypedResponse(PaginatedResponseDTO<object> source)
    {
        return new PaginatedResponseDTO<PokemonListResponse>
        {
            Data = source.Data as PokemonListResponse,
            Pagination = source.Pagination,
            Success = source.Success,
            ErrorMessage = source.ErrorMessage,
            Timestamp = source.Timestamp,
            RequestId = source.RequestId
        };
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