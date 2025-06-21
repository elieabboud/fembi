using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using PokeApi.Shared.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PokeApi.Shared.Configurations
{
    public class RabbitMQHealthCheck : IHealthCheck
    {
        private readonly IRabbitMQService _rabbitMQService;
        private readonly ILogger<RabbitMQHealthCheck> _logger;

        public RabbitMQHealthCheck(IRabbitMQService rabbitMQService, ILogger<RabbitMQHealthCheck> logger)
        {
            _rabbitMQService = rabbitMQService;
            _logger = logger;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogDebug("Performing RabbitMQ health check");

                var isHealthy = await _rabbitMQService.IsHealthyAsync();

                if (isHealthy)
                {
                    var data = new Dictionary<string, object>
                    {
                        ["status"] = "healthy",
                        ["timestamp"] = DateTime.UtcNow
                    };

                    _logger.LogDebug("RabbitMQ health check passed");
                    return HealthCheckResult.Healthy("RabbitMQ connection is healthy and operational", data);
                }
                else
                {
                    var errorData = new Dictionary<string, object>
                    {
                        ["status"] = "unhealthy",
                        ["timestamp"] = DateTime.UtcNow,
                        ["reason"] = "Connection is not available"
                    };

                    _logger.LogWarning("RabbitMQ health check failed - connection unavailable");
                    return HealthCheckResult.Unhealthy("RabbitMQ connection is not available", null, errorData);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "RabbitMQ health check failed due to exception");

                var errorData = new Dictionary<string, object>
                {
                    ["status"] = "unhealthy",
                    ["timestamp"] = DateTime.UtcNow,
                    ["exception"] = ex.GetType().Name,
                    ["message"] = ex.Message
                };

                return HealthCheckResult.Unhealthy("RabbitMQ health check failed", ex, errorData);
            }
        }
    }
}
