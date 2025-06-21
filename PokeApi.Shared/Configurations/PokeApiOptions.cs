using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PokeApi.Shared.Configurations
{
    public class ExternalApiOptions
    {
        public const string SectionName = "ExternalApis";

        public PokeApiOptions PokeApi { get; set; } = new();
    }

    public class PokeApiOptions
    {
        [Required]
        [Url]
        public string BaseUrl { get; set; } = "https://pokeapi.co/api/v2/";

        [Range(1, 300)]
        public int TimeoutSeconds { get; set; } = 30;

        [Range(0, 10)]
        public int RetryAttempts { get; set; } = 3;

        [Range(1, 60)]
        public int CacheExpirationMinutes { get; set; } = 10;

        [Range(1, 5)]
        public int CircuitBreakerFailureThreshold { get; set; } = 3;

        [Range(1, 300)]
        public int CircuitBreakerTimeoutSeconds { get; set; } = 30;
    }

    public class WrapperApiOptions
    {
        public const string SectionName = "WrapperApi";

        [Required]
        [Url]
        public string BaseUrl { get; set; } = "http://localhost:5001";

        [Range(1, 300)]
        public int TimeoutSeconds { get; set; } = 30;

        [Range(0, 10)]
        public int RetryAttempts { get; set; } = 3;
    }

    public class RateLimitOptions
    {
        public const string SectionName = "RateLimit";

        public bool EnableRateLimit { get; set; } = true;
        public int RequestsPerMinute { get; set; } = 100;
        public int RequestsPerHour { get; set; } = 1000;
        public string RealIpHeader { get; set; } = "X-Real-IP";
    }

}
