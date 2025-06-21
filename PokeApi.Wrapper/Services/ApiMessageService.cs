using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Interfaces;

namespace PokeApi.Wrapper.Services
{
    public class ApiMessageService : IApiMessageService, IHostedService
    {
        private readonly IRabbitMQService _rabbitMQService;
        private readonly IExternalApiService _externalApiService;
        private readonly ILogger<ApiMessageService> _logger;
        private readonly CancellationTokenSource _cancellationTokenSource;

        public ApiMessageService(
            IRabbitMQService rabbitMQService,
            IExternalApiService externalApiService,
            ILogger<ApiMessageService> logger)
        {
            _rabbitMQService = rabbitMQService;
            _externalApiService = externalApiService;
            _logger = logger;
            _cancellationTokenSource = new CancellationTokenSource();
        }

        public async Task<PaginatedResponseDTO<object>?> RequestDataAsync(string source, int limit, int offset,
            string correlationId, CancellationToken cancellationToken = default)
        {
            // This method is not used in the wrapper service since it's the consumer, not producer
            throw new NotSupportedException("Wrapper service processes requests, it doesn't make them");
        }

        public async Task StartProcessingRequestsAsync(CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Starting API message processing...");

            await _rabbitMQService.StartConsumingAsync<ApiRequestMessage>(
                QueueNames.ApiRequest,
                ProcessApiRequestAsync,
                cancellationToken);

            _logger.LogInformation("API message processing started");
        }

        public async Task StopProcessingAsync()
        {
            _logger.LogInformation("Stopping API message processing...");

            _cancellationTokenSource.Cancel();
            await _rabbitMQService.StopConsumingAsync(QueueNames.ApiRequest);

            _logger.LogInformation("API message processing stopped");
        }

        private async Task<bool> ProcessApiRequestAsync(MessageEnvelope<ApiRequestMessage> envelope)
        {
            var request = envelope.Payload;
            var startTime = DateTime.UtcNow;

            _logger.LogInformation("Processing API request: {RequestId}, Source: {Source}, Limit: {Limit}, Offset: {Offset}, Correlation: {CorrelationId}",
                request.RequestId, request.Source, request.Limit, request.Offset, request.CorrelationId);

            try
            {
                // Call the existing ExternalApiService to get data
                var result = await _externalApiService.GetDataAsync(request.Source, request.Limit, request.Offset);

                _logger.LogInformation("ExternalApiService returned: Success={Success}, HasData={HasData}, Source={Source}",
                    result.Success, result.Data != null, request.Source);

                var processingTime = DateTime.UtcNow - startTime;

                // Create response message
                var responseMessage = new ApiResponseMessage
                {
                    RequestId = request.RequestId,
                    CorrelationId = request.CorrelationId,
                    Source = request.Source,
                    Success = result.Success,
                    Data = result.Success && result.Data != null ? result : null,
                    ErrorMessage = result.ErrorMessage,
                    ProcessingTime = processingTime
                };

                // Enhanced logging for debugging
                if (responseMessage.Data != null)
                {
                    _logger.LogInformation("Response data created successfully for {Source}: HasData={HasData}",
                        request.Source, responseMessage.Data.Data != null);
                }
                else
                {
                    _logger.LogWarning("Response data is null for request: {RequestId}, Source: {Source}, Original success: {OriginalSuccess}",
                        request.RequestId, request.Source, result.Success);
                }

                // Get reply-to queue from request
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

                _logger.LogInformation("Sending response to queue: {ReplyTo} for request: {RequestId}, Source: {Source}",
                    replyTo, request.RequestId, request.Source);

                // Publish response directly to the reply queue
                var published = await _rabbitMQService.PublishAsync(
                    "", // Empty exchange for direct queue publishing
                    replyTo, // Direct queue name as routing key
                    responseMessage,
                    request.CorrelationId);

                if (published)
                {
                    _logger.LogInformation("API response sent successfully: {RequestId}, Source: {Source}, Success: {Success}, HasData: {HasData}, Correlation: {CorrelationId}",
                        request.RequestId, request.Source, result.Success, responseMessage.Data?.Data != null, request.CorrelationId);
                    return true;
                }
                else
                {
                    _logger.LogError("Failed to publish API response: {RequestId}, Source: {Source}, Correlation: {CorrelationId}",
                        request.RequestId, request.Source, request.CorrelationId);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing API request: {RequestId}, Source: {Source}, Correlation: {CorrelationId}",
                    request.RequestId, request.Source, request.CorrelationId);

                // Send error response
                var replyTo = request.ReplyTo ?? request.Headers.GetValueOrDefault("reply-to")?.ToString();
                if (!string.IsNullOrEmpty(replyTo))
                {
                    var errorResponse = new ApiResponseMessage
                    {
                        RequestId = request.RequestId,
                        CorrelationId = request.CorrelationId,
                        Source = request.Source,
                        Success = false,
                        ErrorMessage = "Internal error processing API request",
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