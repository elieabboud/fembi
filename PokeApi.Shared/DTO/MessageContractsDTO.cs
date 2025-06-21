using System.ComponentModel.DataAnnotations;
using PokeApi.Shared.Configurations;

namespace PokeApi.Shared.DTO
{
    public class ApiRequestMessage
    {
        [Required]
        public string RequestId { get; set; } = string.Empty;

        [Required]
        public string CorrelationId { get; set; } = string.Empty;

        [Required]
        [ApiSource]
        public string Source { get; set; } = string.Empty;

        [Range(1, 1000)]
        public int Limit { get; set; } = 20;

        [Range(0, int.MaxValue)]
        public int Offset { get; set; } = 0;

        public DateTime RequestTimestamp { get; set; } = DateTime.UtcNow;

        public string? ReplyTo { get; set; }

        public Dictionary<string, object> Headers { get; set; } = new();
    }

    public class ApiResponseMessage
    {
        [Required]
        public string RequestId { get; set; } = string.Empty;

        [Required]
        public string CorrelationId { get; set; } = string.Empty;

        [Required]
        public string Source { get; set; } = string.Empty;

        public bool Success { get; set; }

        public PaginatedResponseDTO<object>? Data { get; set; }

        public string? ErrorMessage { get; set; }

        public DateTime ResponseTimestamp { get; set; } = DateTime.UtcNow;

        public TimeSpan ProcessingTime { get; set; }

        public Dictionary<string, object> Headers { get; set; } = new();
    }

    public class MessageEnvelope<T>
    {
        [Required]
        public string MessageId { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string CorrelationId { get; set; } = string.Empty;

        [Required]
        public T Payload { get; set; } = default!;

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public string MessageType { get; set; } = typeof(T).Name;

        public int RetryCount { get; set; } = 0;

        public Dictionary<string, object> Headers { get; set; } = new();
    }
}