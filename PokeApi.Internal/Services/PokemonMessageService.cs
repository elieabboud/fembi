using Microsoft.Extensions.Options;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Interfaces;

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
            _replyQueueName = $"pokemon.reply.{Environment.MachineName}.{Guid.NewGuid():N}";
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

                var timeout = TimeSpan.FromSeconds(_options.RequestTimeoutSeconds);

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
                    _logger.LogInformation("Received Pokemon response via message queue: Success: {Success}, Correlation: {CorrelationId}",
                        response.Success, correlationId);

                    return ConvertFromMessageResponse(response);
                }
                else
                {
                    _logger.LogWarning("No response received for Pokemon request, Correlation: {CorrelationId}", correlationId);
                    return CreateErrorResponse("No response received from wrapper service", correlationId);
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Pokemon request timed out, Correlation: {CorrelationId}", correlationId);
                return CreateErrorResponse("Request timed out", correlationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error requesting Pokemon data via message queue, Correlation: {CorrelationId}", correlationId);
                return CreateErrorResponse("Internal error occurred", correlationId);
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

        private static PaginatedResponseDTO<object> ConvertFromMessageResponse(PokemonResponseMessage response)
        {
            return new PaginatedResponseDTO<object>
            {
                Data = response.Data?.Data,
                Pagination = response.Data?.Pagination ?? new PaginationMetadata(),
                Success = response.Success,
                ErrorMessage = response.ErrorMessage,
                Timestamp = response.ResponseTimestamp,
                RequestId = response.RequestId
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
}
