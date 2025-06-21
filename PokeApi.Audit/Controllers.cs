using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using PokeApi.Audit.Interfaces;
using PokeApi.Audit.Models;
using PokeApi.Audit.Services;
using PokeApi.Shared.Extensions;
using PokeApi.Shared.Middleware;
using Swashbuckle.AspNetCore.Annotations;

namespace PokeApi.Audit.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [Produces("application/json")]
    public class AuditController : ControllerBase
    {
        private readonly IAuditService _auditService;
        private readonly ILogger<AuditController> _logger;

        public AuditController(IAuditService auditService, ILogger<AuditController> logger)
        {
            _auditService = auditService;
            _logger = logger;
        }

        /// <summary>
        /// Get audit logs with optional filtering and pagination
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Items per page (default: 50, max: 100)</param>
        /// <param name="source">Filter by data source (pokemon/product)</param>
        /// <param name="success">Filter by success status</param>
        /// <returns>Paginated list of audit logs</returns>
        [HttpGet]
        [SwaggerOperation(
            Summary = "Get Audit Logs",
            Description = "Retrieves a paginated list of audit logs with optional filtering by source and success status"
        )]
        [SwaggerResponse(200, "Audit logs retrieved successfully", typeof(IEnumerable<AuditLog>))]
        [SwaggerResponse(400, "Invalid parameters")]
        [SwaggerResponse(500, "Internal server error")]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetAuditLogs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] string? source = null,
            [FromQuery] bool? success = null)
        {
            var correlationId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString();

            try
            {
                // Validate parameters
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 50;
                if (pageSize > 100) pageSize = 100;

                _logger.LogInformation("Getting audit logs: page={Page}, pageSize={PageSize}, source={Source}, success={Success}, correlationId={CorrelationId}",
                    page, pageSize, source, success, correlationId);

                var auditLogs = await _auditService.GetAuditLogs(page, pageSize, source, success);

                Response.TryAddHeader("X-Page", page.ToString());
                Response.TryAddHeader("X-Page-Size", pageSize.ToString());
                Response.TryAddHeader("X-Audit-Service", "PokeApi.Audit");

                return Ok(auditLogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving audit logs, correlationId={CorrelationId}", correlationId);
                return StatusCode(500, new { error = "Failed to retrieve audit logs", correlationId });
            }
        }

        /// <summary>
        /// Get audit log by ID
        /// </summary>
        /// <param name="id">Audit log ID</param>
        /// <returns>Audit log details</returns>
        [HttpGet("{id:long}")]
        [SwaggerOperation(
            Summary = "Get Audit Log by ID",
            Description = "Retrieves a specific audit log by its ID"
        )]
        [SwaggerResponse(200, "Audit log found", typeof(AuditLog))]
        [SwaggerResponse(404, "Audit log not found")]
        [SwaggerResponse(500, "Internal server error")]
        public async Task<ActionResult<AuditLog>> GetAuditLog(long id)
        {
            var correlationId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString();

            try
            {
                _logger.LogInformation("Getting audit log by ID: {Id}, correlationId={CorrelationId}", id, correlationId);

                var auditLog = await _auditService.GetAuditLog(id);

                if (auditLog == null)
                {
                    return NotFound(new { error = "Audit log not found", id, correlationId });
                }

                return Ok(auditLog);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving audit log by ID: {Id}, correlationId={CorrelationId}", id, correlationId);
                return StatusCode(500, new { error = "Failed to retrieve audit log", id, correlationId });
            }
        }

        /// <summary>
        /// Get audit log by request ID
        /// </summary>
        /// <param name="requestId">Request ID</param>
        /// <returns>Audit log details</returns>
        [HttpGet("request/{requestId}")]
        [SwaggerOperation(
            Summary = "Get Audit Log by Request ID",
            Description = "Retrieves audit log by request ID for correlation tracking"
        )]
        [SwaggerResponse(200, "Audit log found", typeof(AuditLog))]
        [SwaggerResponse(404, "Audit log not found")]
        [SwaggerResponse(500, "Internal server error")]
        public async Task<ActionResult<AuditLog>> GetAuditLogByRequestId(string requestId)
        {
            var correlationId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString();

            try
            {
                _logger.LogInformation("Getting audit log by RequestId: {RequestId}, correlationId={CorrelationId}", requestId, correlationId);

                var auditLog = await _auditService.GetAuditLogByRequestId(requestId);

                if (auditLog == null)
                {
                    return NotFound(new { error = "Audit log not found", requestId, correlationId });
                }

                return Ok(auditLog);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving audit log by RequestId: {RequestId}, correlationId={CorrelationId}", requestId, correlationId);
                return StatusCode(500, new { error = "Failed to retrieve audit log", requestId, correlationId });
            }
        }

        /// <summary>
        /// Get audit logs by correlation ID
        /// </summary>
        /// <param name="correlationId">Correlation ID</param>
        /// <returns>List of related audit logs</returns>
        [HttpGet("correlation/{correlationId}")]
        [SwaggerOperation(
            Summary = "Get Audit Logs by Correlation ID",
            Description = "Retrieves all audit logs related to a specific correlation ID for request tracing"
        )]
        [SwaggerResponse(200, "Audit logs found", typeof(IEnumerable<AuditLog>))]
        [SwaggerResponse(500, "Internal server error")]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetAuditLogsByCorrelationId(string correlationId)
        {
            var currentCorrelationId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString();

            try
            {
                _logger.LogInformation("Getting audit logs by CorrelationId: {CorrelationId}, currentCorrelationId={CurrentCorrelationId}",
                    correlationId, currentCorrelationId);

                var auditLogs = await _auditService.GetAuditLogsByCorrelationId(correlationId);

                return Ok(auditLogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving audit logs by CorrelationId: {CorrelationId}, currentCorrelationId={CurrentCorrelationId}",
                    correlationId, currentCorrelationId);
                return StatusCode(500, new { error = "Failed to retrieve audit logs", correlationId, currentCorrelationId });
            }
        }

        /// <summary>
        /// Get audit statistics
        /// </summary>
        /// <returns>Audit statistics by source</returns>
        [HttpGet("statistics")]
        [SwaggerOperation(
            Summary = "Get Audit Statistics",
            Description = "Retrieves aggregated statistics for all audit logs grouped by data source"
        )]
        [SwaggerResponse(200, "Statistics retrieved successfully", typeof(IEnumerable<AuditStatistics>))]
        [SwaggerResponse(500, "Internal server error")]
        public async Task<ActionResult<IEnumerable<AuditStatistics>>> GetAuditStatistics()
        {
            var correlationId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString();

            try
            {
                _logger.LogInformation("Getting audit statistics, correlationId={CorrelationId}", correlationId);

                var statistics = await _auditService.GetAuditStatistics();

                Response.TryAddHeader("X-Statistics-Generated", DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"));

                return Ok(statistics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving audit statistics, correlationId={CorrelationId}", correlationId);
                return StatusCode(500, new { error = "Failed to retrieve audit statistics", correlationId });
            }
        }

        /// <summary>
        /// Get audit statistics for specific source
        /// </summary>
        /// <param name="source">Data source (pokemon/product)</param>
        /// <returns>Audit statistics for the specified source</returns>
        [HttpGet("statistics/{source}")]
        [SwaggerOperation(
            Summary = "Get Audit Statistics by Source",
            Description = "Retrieves aggregated statistics for a specific data source"
        )]
        [SwaggerResponse(200, "Statistics retrieved successfully", typeof(AuditStatistics))]
        [SwaggerResponse(404, "No statistics found for source")]
        [SwaggerResponse(500, "Internal server error")]
        public async Task<ActionResult<AuditStatistics>> GetAuditStatisticsBySource(string source)
        {
            var correlationId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString();

            try
            {
                _logger.LogInformation("Getting audit statistics for source: {Source}, correlationId={CorrelationId}", source, correlationId);

                var statistics = await _auditService.GetAuditStatisticsBySource(source);

                if (statistics == null)
                {
                    return NotFound(new { error = "No statistics found for source", source, correlationId });
                }

                return Ok(statistics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving audit statistics for source: {Source}, correlationId={CorrelationId}", source, correlationId);
                return StatusCode(500, new { error = "Failed to retrieve audit statistics", source, correlationId });
            }
        }

        /// <summary>
        /// Health check endpoint
        /// </summary>
        /// <returns>Service health status</returns>
        [HttpGet("health")]
        [SwaggerOperation(Summary = "Health Check", Description = "Returns the health status of the audit service")]
        [SwaggerResponse(200, "Service is healthy")]
        [SwaggerResponse(503, "Service is unhealthy")]
        public IActionResult Health()
        {
            var correlationId = HttpContext.Items[CorrelationConstants.CorrelationIdItem]?.ToString() ?? Guid.NewGuid().ToString();

            var healthStatus = new
            {
                Status = "Healthy",
                Timestamp = DateTime.UtcNow,
                Service = "Pokemon API Audit Service",
                Version = "1.0",
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Unknown",
                Database = "PostgreSQL",
                RequestId = correlationId
            };

            return Ok(healthStatus);
        }
    }
}