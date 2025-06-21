using PokeApi.Audit.Interfaces;
using PokeApi.Audit.Services;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Interfaces;
using static PokeApi.Shared.DTO.AuditMessagesDTO;

namespace PokeApi.Audit.Services
{
    public class AuditMessageService : IHostedService
    {
        private readonly IRabbitMQService _rabbitMQService;
        private readonly IAuditService _auditService;
        private readonly ILogger<AuditMessageService> _logger;
        private readonly CancellationTokenSource _cancellationTokenSource;

        public AuditMessageService(
            IRabbitMQService rabbitMQService,
            IAuditService auditService,
            ILogger<AuditMessageService> logger)
        {
            _rabbitMQService = rabbitMQService;
            _auditService = auditService;
            _logger = logger;
            _cancellationTokenSource = new CancellationTokenSource();
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Starting Audit Message Service...");

            try
            {
                // Ensure RabbitMQ infrastructure is declared
                _rabbitMQService.DeclareInfrastructure();

                // Start consuming audit events
                await _rabbitMQService.StartConsumingAsync<AuditEventMessage>(
                    QueueNames.AuditEvent,
                    ProcessAuditEventAsync,
                    cancellationToken);

                _logger.LogInformation("Audit Message Service started successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start Audit Message Service");
                throw;
            }
        }

        public async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Stopping Audit Message Service...");

            try
            {
                _cancellationTokenSource.Cancel();
                await _rabbitMQService.StopConsumingAsync(QueueNames.AuditEvent);

                _logger.LogInformation("Audit Message Service stopped successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping Audit Message Service");
            }
            finally
            {
                _cancellationTokenSource.Dispose();
            }
        }

        private async Task<bool> ProcessAuditEventAsync(MessageEnvelope<AuditEventMessage> envelope)
        {
            var auditEvent = envelope.Payload;
            var startTime = DateTime.UtcNow;

            _logger.LogInformation("Processing audit event: RequestId={RequestId}, Source={Source}, CorrelationId={CorrelationId}",
                auditEvent.RequestId, auditEvent.Source, auditEvent.CorrelationId);

            try
            {
                // Log the audit event to the database
                var auditLogId = await _auditService.LogApiRequest(
                    requestId: auditEvent.RequestId,
                    correlationId: auditEvent.CorrelationId,
                    source: auditEvent.Source,
                    limit: auditEvent.Limit,
                    offset: auditEvent.Offset,
                    success: auditEvent.Success,
                    responseData: auditEvent.ResponseData,
                    errorMessage: auditEvent.ErrorMessage,
                    processingTimeMs: auditEvent.ProcessingTimeMs,
                    externalApiUrl: auditEvent.ExternalApiUrl,
                    cacheHit: auditEvent.CacheHit
                );

                var processingTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

                _logger.LogInformation("Audit event processed successfully: AuditLogId={AuditLogId}, RequestId={RequestId}, Source={Source}, ProcessingTime={ProcessingTime}ms",
                    auditLogId, auditEvent.RequestId, auditEvent.Source, processingTime);

                return true;
            }
            catch (Exception ex)
            {
                var processingTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

                _logger.LogError(ex, "Failed to process audit event: RequestId={RequestId}, Source={Source}, CorrelationId={CorrelationId}, ProcessingTime={ProcessingTime}ms",
                    auditEvent.RequestId, auditEvent.Source, auditEvent.CorrelationId, processingTime);

                // Don't retry for data integrity issues, but do retry for temporary issues
                if (ex.Message.Contains("duplicate") || ex.Message.Contains("constraint"))
                {
                    _logger.LogWarning("Duplicate audit event detected, skipping: RequestId={RequestId}", auditEvent.RequestId);
                    return true; // Consider this "successful" to avoid infinite retries
                }

                return false; // Will be retried
            }
        }
    }

    // Extension to help with audit event publishing from other services
    public static class AuditEventExtensions
    {
        public static async Task<bool> PublishAuditEventAsync(
            this IRabbitMQService rabbitMQService,
            string requestId,
            string correlationId,
            string source,
            int limit,
            int offset,
            bool success,
            object? responseData = null,
            string? errorMessage = null,
            int? processingTimeMs = null,
            string? externalApiUrl = null,
            bool cacheHit = false,
            ILogger? logger = null)
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

                var published = await rabbitMQService.PublishAsync(
                    ExchangeNames.Audit,
                    RoutingKeys.AuditEvent,
                    auditEvent,
                    correlationId
                );

                if (published)
                {
                    logger?.LogDebug("Audit event published successfully: RequestId={RequestId}, Source={Source}", requestId, source);
                }
                else
                {
                    logger?.LogWarning("Failed to publish audit event: RequestId={RequestId}, Source={Source}", requestId, source);
                }

                return published;
            }
            catch (Exception ex)
            {
                logger?.LogError(ex, "Exception publishing audit event: RequestId={RequestId}, Source={Source}", requestId, source);
                return false;
            }
        }
    }
}