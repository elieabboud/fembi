using PokeApi.Audit.Models;

namespace PokeApi.Audit.Interfaces
{
    public interface IAuditService
    {
        Task<long> LogApiRequest(string requestId, string correlationId, string source,
            int limit, int offset, bool success, object? responseData = null,
            string? errorMessage = null, int? processingTimeMs = null,
            string? externalApiUrl = null, bool cacheHit = false);

        Task<AuditLog?> GetAuditLog(long id);
        Task<AuditLog?> GetAuditLogByRequestId(string requestId);
        Task<IEnumerable<AuditLog>> GetAuditLogs(int page = 1, int pageSize = 50, string? source = null, bool? success = null);
        Task<IEnumerable<AuditLog>> GetAuditLogsByCorrelationId(string correlationId);
        Task<IEnumerable<AuditStatistics>> GetAuditStatistics();
        Task<AuditStatistics?> GetAuditStatisticsBySource(string source);
    }
}
