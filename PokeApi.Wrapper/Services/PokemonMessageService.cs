using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Interfaces;
using PokeApi.Wrapper.Interfaces;
using System.Text.Json;
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

                _logger.LogInformation("PokeApiService returned: Success={Success}, HasData={HasData}, PokemonCount={PokemonCount}",
                    result.Success,
                    result.Data != null,
                    result.Data?.Results?.Count ?? 0);

                var processingTime = DateTime.UtcNow - startTime;

                // FIXED: Create response message with proper data preservation
                var responseMessage = new PokemonResponseMessage
                {
                    RequestId = request.RequestId,
                    CorrelationId = request.CorrelationId,
                    Success = result.Success,
                    // CRITICAL FIX: Properly convert the data without losing the Pokemon information
                    Data = result.Success && result.Data != null ?
                        ConvertToGenericResponseFixed(result) :
                        CreateEmptyResponse(result),
                    ErrorMessage = result.ErrorMessage,
                    ProcessingTime = processingTime
                };

                // Enhanced logging for debugging
                if (responseMessage.Data?.Data != null)
                {
                    var pokemonData = responseMessage.Data.Data;
                    _logger.LogInformation("Response prepared: DataType={DataType}, IsNull={IsNull}",
                        pokemonData.GetType().Name, pokemonData == null);

                    // Try to log Pokemon count if it's a PokemonListResponse
                    if (pokemonData is PokemonListResponse pokemonList)
                    {
                        _logger.LogInformation("Pokemon list has {Count} results", pokemonList.Results?.Count ?? 0);
                    }
                }
                else
                {
                    _logger.LogWarning("Response data is null for request: {RequestId}", request.RequestId);
                }

                // Get reply-to queue from headers
                var replyTo = request.ReplyTo;
                if (string.IsNullOrEmpty(replyTo) && request.Headers.TryGetValue("reply-to", out var replyToValue))
                {
                    replyTo = replyToValue?.ToString();
                }

                if (string.IsNullOrEmpty(replyTo))
                {
                    _logger.LogError("No reply-to queue specified for request: {RequestId}", request.RequestId);
                    return false;
                }

                _logger.LogInformation("Sending response to queue: {ReplyTo} for request: {RequestId}", replyTo, request.RequestId);

                // Publish response directly to the reply queue
                var published = await _rabbitMQService.PublishAsync(
                    "", // Empty exchange for direct queue publishing
                    replyTo, // Direct queue name as routing key
                    responseMessage,
                    request.CorrelationId);

                if (published)
                {
                    _logger.LogInformation("Pokemon response sent successfully: {RequestId}, Success: {Success}, HasData: {HasData}, Correlation: {CorrelationId}",
                        request.RequestId, result.Success, responseMessage.Data?.Data != null, request.CorrelationId);
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
                var replyTo = request.ReplyTo ?? request.Headers.GetValueOrDefault("reply-to")?.ToString();
                if (!string.IsNullOrEmpty(replyTo))
                {
                    var errorResponse = new PokemonResponseMessage
                    {
                        RequestId = request.RequestId,
                        CorrelationId = request.CorrelationId,
                        Success = false,
                        ErrorMessage = "Internal error processing Pokemon request",
                        ProcessingTime = DateTime.UtcNow - startTime
                    };

                    await _rabbitMQService.PublishAsync(
                        "", // Empty exchange for direct queue publishing
                        replyTo,
                        errorResponse,
                        request.CorrelationId);
                }

                return false;
            }
        }

        // FIXED: Proper data conversion that preserves the Pokemon data
        private PaginatedResponseDTO<object> ConvertToGenericResponseFixed(PaginatedResponseDTO<PokemonListResponse> source)
        {
            if (source?.Data == null)
            {
                _logger.LogWarning("Source data is null during conversion");
                return CreateEmptyResponse(source);
            }

            _logger.LogDebug("Converting PokemonListResponse to generic response. Pokemon count: {Count}",
                source.Data.Results?.Count ?? 0);

            // The key fix: ensure the PokemonListResponse is properly preserved as the object
            var converted = new PaginatedResponseDTO<object>
            {
                Data = source.Data, // This should contain the actual PokemonListResponse
                Pagination = source.Pagination ?? new PaginationMetadata(),
                Success = source.Success,
                ErrorMessage = source.ErrorMessage,
                Timestamp = source.Timestamp,
                RequestId = source.RequestId
            };

            // Verification logging
            if (converted.Data is PokemonListResponse pokemonList)
            {
                _logger.LogDebug("Conversion successful: Pokemon count: {Count}, HasNext: {HasNext}, HasPrev: {HasPrev}",
                    pokemonList.Results?.Count ?? 0,
                    pokemonList.Next != null,
                    pokemonList.Previous != null);
            }
            else
            {
                _logger.LogError("Conversion failed: Data is not PokemonListResponse but {Type}",
                    converted.Data?.GetType().Name ?? "null");
            }

            return converted;
        }

        // Helper method to create empty response when data is null
        private PaginatedResponseDTO<object> CreateEmptyResponse(PaginatedResponseDTO<PokemonListResponse>? source)
        {
            return new PaginatedResponseDTO<object>
            {
                Data = null,
                Pagination = source?.Pagination ?? new PaginationMetadata(),
                Success = source?.Success ?? false,
                ErrorMessage = source?.ErrorMessage ?? "No data available",
                Timestamp = source?.Timestamp ?? DateTime.UtcNow,
                RequestId = source?.RequestId
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