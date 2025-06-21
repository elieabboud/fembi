using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PokeApi.Shared.DTO
{
    public class AuditMessagesDTO
    {
        public class AuditEventMessage
        {
            [Required]
            public string RequestId { get; set; } = string.Empty;

            [Required]
            public string CorrelationId { get; set; } = string.Empty;

            [Required]
            public string Source { get; set; } = string.Empty;

            public int Limit { get; set; }

            public int Offset { get; set; }

            public bool Success { get; set; }

            public object? ResponseData { get; set; }

            public string? ErrorMessage { get; set; }

            public int? ProcessingTimeMs { get; set; }

            public string? ExternalApiUrl { get; set; }

            public bool CacheHit { get; set; } = false;

            public DateTime EventTimestamp { get; set; } = DateTime.UtcNow;

            public Dictionary<string, object> AdditionalMetadata { get; set; } = new();
        }

        public class AuditRequestMessage
        {
            [Required]
            public string RequestId { get; set; } = string.Empty;

            [Required]
            public string CorrelationId { get; set; } = string.Empty;

            [Required]
            public string Source { get; set; } = string.Empty;

            public int Limit { get; set; }

            public int Offset { get; set; }

            public DateTime RequestTimestamp { get; set; } = DateTime.UtcNow;

            public string? ClientIp { get; set; }

            public string? UserAgent { get; set; }

            public Dictionary<string, string> Headers { get; set; } = new();
        }

        public class AuditResponseMessage
        {
            [Required]
            public string RequestId { get; set; } = string.Empty;

            [Required]
            public string CorrelationId { get; set; } = string.Empty;

            public bool Success { get; set; }

            public object? ResponseData { get; set; }

            public string? ErrorMessage { get; set; }

            public int ProcessingTimeMs { get; set; }

            public bool CacheHit { get; set; } = false;

            public DateTime ResponseTimestamp { get; set; } = DateTime.UtcNow;

            public int? StatusCode { get; set; }

            public long? ResponseSizeBytes { get; set; }
        }
    }
}
