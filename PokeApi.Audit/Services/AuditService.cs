using Microsoft.EntityFrameworkCore;
using PokeApi.Audit.Data;
using PokeApi.Audit.Interfaces;
using PokeApi.Audit.Models;
using System.Text.Json;

namespace PokeApi.Audit.Services
{
    public class AuditService : IAuditService
    {
        private readonly AuditDbContext _context;
        private readonly ILogger<AuditService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;

        public AuditService(AuditDbContext context, ILogger<AuditService> logger)
        {
            _context = context;
            _logger = logger;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            };
        }

        public async Task<long> LogApiRequest(string requestId, string correlationId, string source,
            int limit, int offset, bool success, object? responseData = null,
            string? errorMessage = null, int? processingTimeMs = null,
            string? externalApiUrl = null, bool cacheHit = false)
        {
            try
            {
                var auditLog = new AuditLog
                {
                    RequestId = requestId,
                    CorrelationId = correlationId,
                    Source = source,
                    LimitValue = limit,
                    OffsetValue = offset,
                    Success = success,
                    ResponseDataJson = responseData != null ? JsonSerializer.Serialize(responseData, _jsonOptions) : null,
                    ErrorMessage = errorMessage,
                    ProcessingTimeMs = processingTimeMs,
                    ExternalApiUrl = externalApiUrl,
                    CacheHit = cacheHit,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Audit log created: Id={Id}, RequestId={RequestId}, Source={Source}, Success={Success}",
                    auditLog.Id, requestId, source, success);

                return auditLog.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create audit log for RequestId={RequestId}, Source={Source}",
                    requestId, source);
                throw;
            }
        }

        public async Task<AuditLog?> GetAuditLog(long id)
        {
            return await _context.AuditLogs.FindAsync(id);
        }

        public async Task<AuditLog?> GetAuditLogByRequestId(string requestId)
        {
            return await _context.AuditLogs
                .FirstOrDefaultAsync(a => a.RequestId == requestId);
        }

        public async Task<IEnumerable<AuditLog>> GetAuditLogs(int page = 1, int pageSize = 50,
            string? source = null, bool? success = null)
        {
            var query = _context.AuditLogs.AsQueryable();

            if (!string.IsNullOrEmpty(source))
            {
                query = query.Where(a => a.Source == source);
            }

            if (success.HasValue)
            {
                query = query.Where(a => a.Success == success.Value);
            }

            return await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuditLog>> GetAuditLogsByCorrelationId(string correlationId)
        {
            return await _context.AuditLogs
                .Where(a => a.CorrelationId == correlationId)
                .OrderBy(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuditStatistics>> GetAuditStatistics()
        {
            return await _context.AuditLogs
                .GroupBy(a => a.Source)
                .Select(g => new AuditStatistics
                {
                    Source = g.Key,
                    TotalRequests = g.Count(),
                    SuccessfulRequests = g.Count(a => a.Success),
                    FailedRequests = g.Count(a => !a.Success),
                    CacheHits = g.Count(a => a.CacheHit),
                    AvgProcessingTimeMs = (decimal)(g.Where(a => a.ProcessingTimeMs.HasValue)
                                         .Average(a => a.ProcessingTimeMs) ?? 0),
                    FirstRequest = g.Min(a => a.CreatedAt),
                    LastRequest = g.Max(a => a.CreatedAt)
                })
                .ToListAsync();
        }

        public async Task<AuditStatistics?> GetAuditStatisticsBySource(string source)
        {
            var stats = await _context.AuditLogs
                .Where(a => a.Source == source)
                .GroupBy(a => a.Source)
                .Select(g => new AuditStatistics
                {
                    Source = g.Key,
                    TotalRequests = g.Count(),
                    SuccessfulRequests = g.Count(a => a.Success),
                    FailedRequests = g.Count(a => !a.Success),
                    CacheHits = g.Count(a => a.CacheHit),
                    AvgProcessingTimeMs = (decimal)(g.Where(a => a.ProcessingTimeMs.HasValue)
                                         .Average(a => a.ProcessingTimeMs) ?? 0),
                    FirstRequest = g.Min(a => a.CreatedAt),
                    LastRequest = g.Max(a => a.CreatedAt)
                })
                .FirstOrDefaultAsync();

            return stats;
        }
    }
}
