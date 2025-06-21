using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Interfaces;
using PokeApi.Wrapper.Interfaces;
using static PokeApi.Shared.Models.PokemonModels;

namespace PokeApi.Wrapper.Services
{
    public class PokemonMessageService : IPokemonMessageService, IHostedService
    {
        private readonly IRabbitMQService _rabbitMQService;
        private readonly IPokeApiService _pokeApiService;
        private readonly ILogger<PokemonMessageService> _logger;
        private readonly CancellationTokenSource _cancellationTokenSource;

        public PokemonMessageService(
            IRabbitMQService rabbitMQService,
            IPokeApiService pokeApiService,
            ILogger<PokemonMessageService> logger)
        {
            _rabbitMQService = rabbitMQService;
            _pokeApiService = pokeApiService;
            _logger = logger;
            _cancellationTokenSource = new CancellationTokenSource();
        }

        public async Task<PaginatedResponseDTO<object>?> RequestPokemonDataAsync(int limit, int offset,
            string correlationId, CancellationToken cancellationToken = default)
        {
            // This method is not used in the wrapper service since it's the consumer, not producer
            throw new NotSupportedException("Wrapper service processes requests, it doesn't make them");
        }

        public async Task StartProcessingRequestsAsync(CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Starting Pokemon message processing...");

            await _rabbitMQService.StartConsumingAsync<PokemonRequestMessage>(
                QueueNames.PokemonRequest,
                ProcessPokemonRequestAsync,
                cancellationToken);

            _logger.LogInformation("Pokemon message processing started");
        }

        public async Task StopProcessingAsync()
        {
            _logger.LogInformation("Stopping Pokemon message processing...");

            _cancellationTokenSource.Cancel();
            await _rabbitMQService.StopConsumingAsync(QueueNames.PokemonRequest);

            _logger.LogInformation("Pokemon message processing stopped");
        }

        private async Task<bool> ProcessPokemonRequestAsync(MessageEnvelope<PokemonRequestMessage> envelope)
        {
            var request = envelope.Payload;
            var startTime = DateTime.UtcNow;

            _logger.LogInformation("Processing Pokemon request: {RequestId}, Limit: {Limit}, Offset: {Offset}, Correlation: {CorrelationId}",
                request.RequestId, request.Limit, request.Offset, request.CorrelationId);

            try
            {
                // Call the existing PokeApiService to get Pokemon data
                var result = await _pokeApiService.GetPokemonList(request.Limit, request.Offset);

                var processingTime = DateTime.UtcNow - startTime;

                // Create response message
                var responseMessage = new PokemonResponseMessage
                {
                    RequestId = request.RequestId,
                    CorrelationId = request.CorrelationId,
                    Success = result.Success,
                    Data = result.Success ? ConvertToGenericResponse(result) : null,
                    ErrorMessage = result.ErrorMessage,
                    ProcessingTime = processingTime
                };

                // Get reply-to queue from headers
                var replyTo = request.Headers.TryGetValue("reply-to", out var replyToValue)
                    ? replyToValue?.ToString()
                    : QueueNames.PokemonResponse;

                // Publish response
                var published = await _rabbitMQService.PublishAsync(
                    ExchangeNames.Pokemon,
                    RoutingKeys.PokemonResponse,
                    responseMessage,
                    request.CorrelationId);

                if (published)
                {
                    _logger.LogInformation("Pokemon response sent successfully: {RequestId}, Success: {Success}, Correlation: {CorrelationId}",
                        request.RequestId, result.Success, request.CorrelationId);
                    return true;
                }
                else
                {
                    _logger.LogError("Failed to publish Pokemon response: {RequestId}, Correlation: {CorrelationId}",
                        request.RequestId, request.CorrelationId);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Pokemon request: {RequestId}, Correlation: {CorrelationId}",
                    request.RequestId, request.CorrelationId);

                // Send error response
                var errorResponse = new PokemonResponseMessage
                {
                    RequestId = request.RequestId,
                    CorrelationId = request.CorrelationId,
                    Success = false,
                    ErrorMessage = "Internal error processing Pokemon request",
                    ProcessingTime = DateTime.UtcNow - startTime
                };

                await _rabbitMQService.PublishAsync(
                    ExchangeNames.Pokemon,
                    RoutingKeys.PokemonResponse,
                    errorResponse,
                    request.CorrelationId);

                return false;
            }
        }

        private static PaginatedResponseDTO<object> ConvertToGenericResponse(PaginatedResponseDTO<PokemonListResponse> source)
        {
            return new PaginatedResponseDTO<object>
            {
                Data = source.Data,
                Pagination = source.Pagination,
                Success = source.Success,
                ErrorMessage = source.ErrorMessage,
                Timestamp = source.Timestamp,
                RequestId = source.RequestId
            };
        }

        // IHostedService implementation
        public async Task StartAsync(CancellationToken cancellationToken)
        {
            await StartProcessingRequestsAsync(cancellationToken);
        }

        public async Task StopAsync(CancellationToken cancellationToken)
        {
            await StopProcessingAsync();
            _cancellationTokenSource.Dispose();
        }
    }
}
