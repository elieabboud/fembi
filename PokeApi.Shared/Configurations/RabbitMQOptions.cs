using System.ComponentModel.DataAnnotations;

namespace PokeApi.Shared.Configurations
{
    public class RabbitMQOptions
    {
        public const string SectionName = "RabbitMQ";

        [Required]
        public string HostName { get; set; } = "localhost";

        public int Port { get; set; } = 5672;

        [Required]
        public string UserName { get; set; } = "guest";

        [Required]
        public string Password { get; set; } = "guest";

        public string VirtualHost { get; set; } = "/";

        public int ConnectionTimeoutSeconds { get; set; } = 30;

        public int RequestTimeoutSeconds { get; set; } = 30;

        public int RetryAttempts { get; set; } = 3;

        public int RetryDelayMs { get; set; } = 1000;

        public bool EnableSsl { get; set; } = false;

        public string? ClientProvidedName { get; set; }
    }

    public static class QueueNames
    {
        // Pokemon Service Queues
        public const string PokemonRequest = "pokemon.request";
        public const string PokemonResponse = "pokemon.response";
        public const string PokemonRequestDLQ = "pokemon.request.dlq";
        public const string PokemonResponseDLQ = "pokemon.response.dlq";

        // API Request/Response Queues
        public const string ApiRequest = "api.request";
        public const string ApiResponse = "api.response";
        public const string ApiRequestDLQ = "api.request.dlq";
        public const string ApiResponseDLQ = "api.response.dlq";

        // NEW: Audit Queues
        public const string AuditEvent = "audit.event";
        public const string AuditEventDLQ = "audit.event.dlq";
        public const string AuditRequest = "audit.request";
        public const string AuditResponse = "audit.response";
        public const string AuditRequestDLQ = "audit.request.dlq";
        public const string AuditResponseDLQ = "audit.response.dlq";
    }

    public static class ExchangeNames
    {
        // Pokemon Exchange
        public const string Pokemon = "pokemon.exchange";
        public const string PokemonDLX = "pokemon.dlx";

        // API Exchange
        public const string Api = "api.exchange";
        public const string ApiDLX = "api.dlx";

        // NEW: Audit Exchange
        public const string Audit = "audit.exchange";
        public const string AuditDLX = "audit.dlx";
    }

    public static class RoutingKeys
    {
        // Pokemon Routing Keys
        public const string PokemonRequest = "pokemon.request";
        public const string PokemonResponse = "pokemon.response";
        public const string PokemonRequestDLQ = "pokemon.request.dlq";
        public const string PokemonResponseDLQ = "pokemon.response.dlq";

        // API Routing Keys
        public const string ApiRequest = "api.request";
        public const string ApiResponse = "api.response";
        public const string ApiRequestDLQ = "api.request.dlq";
        public const string ApiResponseDLQ = "api.response.dlq";

        // NEW: Audit Routing Keys
        public const string AuditEvent = "audit.event";
        public const string AuditEventDLQ = "audit.event.dlq";
        public const string AuditRequest = "audit.request";
        public const string AuditResponse = "audit.response";
        public const string AuditRequestDLQ = "audit.request.dlq";
        public const string AuditResponseDLQ = "audit.response.dlq";

        // NEW: Specialized Audit Event Types
        public const string AuditApiCall = "audit.api.call";
        public const string AuditCacheHit = "audit.cache.hit";
        public const string AuditError = "audit.error";
        public const string AuditPerformance = "audit.performance";
    }

    public static class MessageTypes
    {
        // Pokemon Message Types
        public const string PokemonRequest = "pokemon.request";
        public const string PokemonResponse = "pokemon.response";

        // API Message Types
        public const string ApiRequest = "api.request";
        public const string ApiResponse = "api.response";

        // NEW: Audit Message Types
        public const string AuditEvent = "audit.event";
        public const string AuditApiCall = "audit.api.call";
        public const string AuditCacheEvent = "audit.cache.event";
        public const string AuditErrorEvent = "audit.error.event";
        public const string AuditPerformanceEvent = "audit.performance.event";
    }

    public static class MessageHeaders
    {
        public const string CorrelationId = "X-Correlation-ID";
        public const string RequestId = "X-Request-ID";
        public const string MessageType = "X-Message-Type";
        public const string Timestamp = "X-Timestamp";
        public const string Source = "X-Source";
        public const string RetryCount = "X-Retry-Count";
        public const string OriginalQueue = "X-Original-Queue";
        public const string FailureReason = "X-Failure-Reason";

        // NEW: Audit-specific headers
        public const string AuditEventType = "X-Audit-Event-Type";
        public const string ApiSource = "X-Api-Source";
        public const string ProcessingTime = "X-Processing-Time";
        public const string CacheHit = "X-Cache-Hit";
        public const string ExternalApiUrl = "X-External-Api-Url";
    }

    // NEW: Audit Configuration
    public static class AuditConfig
    {
        public const int DefaultAuditRetentionDays = 90;
        public const int MaxAuditBatchSize = 100;
        public const int AuditFlushIntervalMs = 5000;
        public const bool EnableAuditCompression = true;
        public const string DefaultAuditLogLevel = "Information";

        public static readonly string[] AuditableEvents =
        {
            "api.call.started",
            "api.call.completed",
            "api.call.failed",
            "cache.hit",
            "cache.miss",
            "external.api.call",
            "error.occurred",
            "performance.threshold.exceeded"
        };
    }

    // NEW: Queue Configuration Settings
    public static class QueueSettings
    {
        public const bool DefaultDurable = true;
        public const bool DefaultExclusive = false;
        public const bool DefaultAutoDelete = false;
        public const int DefaultMessageTTL = 300000; // 5 minutes
        public const int DefaultMaxLength = 10000;
        public const int DefaultMaxRetries = 3;
        public const int DefaultRetryDelayMs = 1000;

        // Audit-specific settings
        public const int AuditMessageTTL = 86400000; // 24 hours
        public const int AuditMaxLength = 50000;
        public const int AuditMaxRetries = 5;
        public const bool AuditPersistent = true;
    }

    // NEW: Exchange Configuration
    public static class ExchangeSettings
    {
        public const string DefaultType = "topic";
        public const bool DefaultDurable = true;
        public const bool DefaultAutoDelete = false;
        public const bool DefaultInternal = false;

        public static readonly Dictionary<string, object> AuditExchangeArguments = new()
        {
            { "x-message-ttl", QueueSettings.AuditMessageTTL },
            { "x-max-length", QueueSettings.AuditMaxLength },
            { "alternate-exchange", "audit.alternate" }
        };
    }
}