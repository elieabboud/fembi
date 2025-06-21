using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace PokeApi.Audit.Models
{
    [Table("audit_logs")]
    public class AuditLog
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("request_id")]
        [MaxLength(255)]
        public string RequestId { get; set; } = string.Empty;

        [Required]
        [Column("correlation_id")]
        [MaxLength(255)]
        public string CorrelationId { get; set; } = string.Empty;

        [Required]
        [Column("source")]
        [MaxLength(50)]
        public string Source { get; set; } = string.Empty;

        [Column("limit_value")]
        public int LimitValue { get; set; }

        [Column("offset_value")]
        public int OffsetValue { get; set; }

        [Column("success")]
        public bool Success { get; set; }

        [Column("response_data", TypeName = "jsonb")]
        public string? ResponseDataJson { get; set; }

        [Column("error_message")]
        public string? ErrorMessage { get; set; }

        [Column("processing_time_ms")]
        public int? ProcessingTimeMs { get; set; }

        [Column("external_api_url")]
        public string? ExternalApiUrl { get; set; }

        [Column("cache_hit")]
        public bool CacheHit { get; set; } = false;

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Helper property for easier object access to ResponseData
        [NotMapped]
        public object? ResponseData
        {
            get => string.IsNullOrEmpty(ResponseDataJson) ? null : JsonSerializer.Deserialize<object>(ResponseDataJson);
            set => ResponseDataJson = value == null ? null : JsonSerializer.Serialize(value);
        }
    }

    public class AuditStatistics
    {
        public string Source { get; set; } = string.Empty;
        public long TotalRequests { get; set; }
        public long SuccessfulRequests { get; set; }
        public long FailedRequests { get; set; }
        public long CacheHits { get; set; }
        public decimal AvgProcessingTimeMs { get; set; }
        public DateTimeOffset? FirstRequest { get; set; }
        public DateTimeOffset? LastRequest { get; set; }

        public decimal SuccessRate => TotalRequests > 0 ? (decimal)SuccessfulRequests / TotalRequests * 100 : 0;
        public decimal CacheHitRate => TotalRequests > 0 ? (decimal)CacheHits / TotalRequests * 100 : 0;
    }
}