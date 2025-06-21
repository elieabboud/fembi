using Microsoft.Extensions.Options;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Interfaces;
using System.Text.Json;

namespace PokeApi.Internal.Services
{
    public class PokemonMessageService : IPokemonMessageService
    {
        private readonly IRabbitMQService _rabbitMQService;
        private readonly ILogger<PokemonMessageService> _logger;
        private readonly RabbitMQOptions _options;
        private readonly string _replyQueueName;

        public PokemonMessageService(
            IRabbitMQService rabbitMQService,
            ILogger<PokemonMessageService> logger,
            IOptions<RabbitMQOptions> options)
        {
            _rabbitMQService = rabbitMQService;
            _logger = logger;
            _options = options.Value;
            // FIXED: Create a unique reply queue name for this instance
            _replyQueueName = $"pokemon.reply.{Environment.MachineName}.{Guid.NewGuid():N}"[..24];
        }

        public async Task<PaginatedResponseDTO<object>?> RequestPokemonDataAsync(int limit, int offset,
            string correlationId, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Requesting Pokemon data via message queue: Limit: {Limit}, Offset: {Offset}, Correlation: {CorrelationId}",
                limit, offset, correlationId);

            try
            {
                var request = new PokemonRequestMessage
                {
                    RequestId = Guid.NewGuid().ToString(),
                    CorrelationId = correlationId,
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

                // FIXED: Use longer timeout and proper cancellation handling
                var timeout = TimeSpan.FromSeconds(Math.Max(_options.RequestTimeoutSeconds, 30));

                _logger.LogInformation("Publishing request with timeout: {Timeout}ms, ReplyQueue: {ReplyQueue}",
                    timeout.TotalMilliseconds, _replyQueueName);

                var response = await _rabbitMQService.PublishAndWaitForReplyAsync<PokemonRequestMessage, PokemonResponseMessage>(
                    ExchangeNames.Pokemon,
                    RoutingKeys.PokemonRequest,
                    request,
                    _replyQueueName,
                    timeout,
                    correlationId,
                    cancellationToken);

                if (response != null)
                {
                    _logger.LogInformation("Received Pokemon response via message queue: Success: {Success}, HasData: {HasData}, Correlation: {CorrelationId}",
                        response.Success, response.Data?.Data != null, correlationId);

                    // FIXED: Log response data details for debugging
                    if (response.Data?.Data != null)
                    {
                        _logger.LogDebug("Response data type: {DataType}", response.Data.Data.GetType().Name);

                        // Try to extract Pokemon count for debugging
                        try
                        {
                            var jsonString = JsonSerializer.Serialize(response.Data.Data);
                            var jsonDoc = JsonDocument.Parse(jsonString);
                            if (jsonDoc.RootElement.TryGetProperty("results", out var resultsElement))
                            {
                                _logger.LogDebug("Pokemon results array length: {Count}", resultsElement.GetArrayLength());
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to parse response data for debugging");
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Response data is null in received message");
                    }

                    return ConvertFromMessageResponse(response);
                }
                else
                {
                    _logger.LogWarning("No response received for Pokemon request, Correlation: {CorrelationId}, Timeout: {Timeout}ms",
                        correlationId, timeout.TotalMilliseconds);
                    return CreateErrorResponse("No response received from wrapper service", correlationId);
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning("Pokemon request was cancelled, Correlation: {CorrelationId}", correlationId);
                return CreateErrorResponse("Request was cancelled", correlationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error requesting Pokemon data via message queue, Correlation: {CorrelationId}", correlationId);
                return CreateErrorResponse($"Internal error occurred: {ex.Message}", correlationId);
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

        // FIXED: Improved conversion with better data preservation
        private static PaginatedResponseDTO<object> ConvertFromMessageResponse(PokemonResponseMessage response)
        {
            var result = new PaginatedResponseDTO<object>
            {
                Data = response.Data?.Data, // Extract the actual data from the nested structure
                Pagination = response.Data?.Pagination ?? new PaginationMetadata(),
                Success = response.Success,
                ErrorMessage = response.ErrorMessage,
                Timestamp = response.ResponseTimestamp,
                RequestId = response.RequestId
            };

            return result;
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