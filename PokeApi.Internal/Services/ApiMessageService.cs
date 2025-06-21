using Microsoft.Extensions.Options;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Interfaces;
using System.Text.Json;

namespace PokeApi.Internal.Services
{
    public class ApiMessageService : IApiMessageService
    {
        private readonly IRabbitMQService _rabbitMQService;
        private readonly ILogger<ApiMessageService> _logger;
        private readonly RabbitMQOptions _options;
        private readonly string _replyQueueName;

        public ApiMessageService(
            IRabbitMQService rabbitMQService,
            ILogger<ApiMessageService> logger,
            IOptions<RabbitMQOptions> options)
        {
            _rabbitMQService = rabbitMQService;
            _logger = logger;
            _options = options.Value;
            // Create a unique reply queue name for this instance
            _replyQueueName = $"api.reply.{Environment.MachineName}.{Guid.NewGuid():N}"[..24];
        }

        public async Task<PaginatedResponseDTO<object>?> RequestDataAsync(string source, int limit, int offset,
            string correlationId, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Requesting {Source} data via message queue: Limit: {Limit}, Offset: {Offset}, Correlation: {CorrelationId}",
                source, limit, offset, correlationId);

            try
            {
                var request = new ApiRequestMessage
                {
                    RequestId = Guid.NewGuid().ToString(),
                    CorrelationId = correlationId,
                    Source = source,
                    Limit = limit,
                    Offset = offset,
                    ReplyTo = _replyQueueName,
                    Headers = new Dictionary<string, object>
                    {
                        ["reply-to"] = _replyQueueName,
                        ["source"] = "internal-api",
                        ["timestamp"] = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                    }
                };

                // Use longer timeout and proper cancellation handling
                var timeout = TimeSpan.FromSeconds(Math.Max(_options.RequestTimeoutSeconds, 30));

                _logger.LogInformation("Publishing {Source} request with timeout: {Timeout}ms, ReplyQueue: {ReplyQueue}",
                    source, timeout.TotalMilliseconds, _replyQueueName);

                var response = await _rabbitMQService.PublishAndWaitForReplyAsync<ApiRequestMessage, ApiResponseMessage>(
                    ExchangeNames.Pokemon, // Using existing exchange
                    RoutingKeys.ApiRequest,
                    request,
                    _replyQueueName,
                    timeout,
                    correlationId,
                    cancellationToken);

                if (response != null)
                {
                    _logger.LogInformation("Received {Source} response via message queue: Success: {Success}, HasData: {HasData}, Correlation: {CorrelationId}",
                        source, response.Success, response.Data?.Data != null, correlationId);

                    // Enhanced logging for debugging data structure
                    if (response.Data?.Data != null)
                    {
                        _logger.LogDebug("Response data type for {Source}: {DataType}", source, response.Data.Data.GetType().Name);

                        // Try to extract count for debugging
                        try
                        {
                            var dataAsJson = JsonSerializer.Serialize(response.Data.Data);
                            _logger.LogDebug("Response data JSON length for {Source}: {Length}", source, dataAsJson.Length);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to parse {Source} response data for debugging", source);
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Response data is null in received {Source} message", source);
                    }

                    return ConvertFromMessageResponse(response);
                }
                else
                {
                    _logger.LogWarning("No response received for {Source} request, Correlation: {CorrelationId}, Timeout: {Timeout}ms",
                        source, correlationId, timeout.TotalMilliseconds);
                    return CreateErrorResponse($"No response received from wrapper service for {source}", correlationId);
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning("{Source} request was cancelled, Correlation: {CorrelationId}", source, correlationId);
                return CreateErrorResponse($"{source} request was cancelled", correlationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error requesting {Source} data via message queue, Correlation: {CorrelationId}", source, correlationId);
                return CreateErrorResponse($"Internal error occurred for {source}: {ex.Message}", correlationId);
            }
        }

        public async Task StartProcessingRequestsAsync(CancellationToken cancellationToken = default)
        {
            // Internal API doesn't process requests, it only sends them
            await Task.CompletedTask;
        }

        public async Task StopProcessingAsync()
        {
            // Internal API doesn't process requests, it only sends them
            await Task.CompletedTask;
        }

        private PaginatedResponseDTO<object> ConvertFromMessageResponse(ApiResponseMessage response)
        {
            try
            {
                _logger.LogDebug("Converting ApiResponseMessage to PaginatedResponseDTO<object> for {Source}", response.Source);

                var result = new PaginatedResponseDTO<object>
                {
                    Data = response.Data?.Data, // Extract the actual data from the nested structure
                    Pagination = response.Data?.Pagination ?? new PaginationMetadata(),
                    Success = response.Success,
                    ErrorMessage = response.ErrorMessage,
                    Timestamp = response.ResponseTimestamp,
                    RequestId = response.RequestId
                };

                // Additional validation and logging
                if (result.Data != null)
                {
                    _logger.LogDebug("Converted {Source} data type: {DataType}", response.Source, result.Data.GetType().Name);
                }
                else
                {
                    _logger.LogWarning("Converted {Source} data is null", response.Source);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error converting ApiResponseMessage for {Source} to PaginatedResponseDTO", response.Source);

                return new PaginatedResponseDTO<object>
                {
                    Data = null,
                    Pagination = new PaginationMetadata(),
                    Success = false,
                    ErrorMessage = $"Data conversion error for {response.Source}: {ex.Message}",
                    Timestamp = DateTime.UtcNow,
                    RequestId = response.RequestId
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