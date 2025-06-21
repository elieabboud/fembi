using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PokeApi.Shared.Configurations;

namespace PokeApi.Wrapper.HealthChecks
{
    public class ExternalApiHealthCheck : IHealthCheck
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ExternalApiHealthCheck> _logger;
        private readonly PokeApiOptions _options;

        public ExternalApiHealthCheck(
            HttpClient httpClient,
            ILogger<ExternalApiHealthCheck> logger,
            IOptions<ExternalApiOptions> options)
        {
            _httpClient = httpClient;
            _logger = logger;
            _options = options.Value.PokeApi;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogDebug("Performing health check on external Pokemon API");

                using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                cts.CancelAfter(TimeSpan.FromSeconds(10)); // Health check timeout

                var response = await _httpClient.GetAsync("pokemon?limit=1", cts.Token);

                if (response.IsSuccessStatusCode)
                {
                    var responseTime = response.Headers.Date?.Subtract(DateTime.UtcNow).Duration();
                    var data = new Dictionary<string, object>
                    {
                        ["status"] = "healthy",
                        ["responseTime"] = responseTime?.TotalMilliseconds ?? 0,
                        ["statusCode"] = (int)response.StatusCode,
                        ["endpoint"] = _options.BaseUrl
                    };

                    _logger.LogDebug("External API health check passed");
                    return HealthCheckResult.Healthy("External Pokemon API is accessible and responding", data);
                }

                var errorData = new Dictionary<string, object>
                {
                    ["status"] = "unhealthy",
                    ["statusCode"] = (int)response.StatusCode,
                    ["endpoint"] = _options.BaseUrl,
                    ["reasonPhrase"] = response.ReasonPhrase ?? "Unknown error"
                };

                _logger.LogWarning("External API health check failed with status code: {StatusCode}", response.StatusCode);
                return HealthCheckResult.Unhealthy($"External Pokemon API returned {response.StatusCode}: {response.ReasonPhrase}", null, errorData);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning("External API health check was cancelled");
                return HealthCheckResult.Unhealthy("Health check was cancelled");
            }
            catch (TaskCanceledException)
            {
                _logger.LogWarning("External API health check timed out");
                return HealthCheckResult.Unhealthy("External Pokemon API health check timed out");
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "External API health check failed due to HTTP request exception");
                return HealthCheckResult.Unhealthy("External Pokemon API is unreachable", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "External API health check failed due to unexpected exception");
                return HealthCheckResult.Unhealthy("Unexpected error during external API health check", ex);
            }
        }
    }
}
