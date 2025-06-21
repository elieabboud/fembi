using System.ComponentModel.DataAnnotations;

namespace PokeApi.Shared.Configurations
{
    public class ExternalApiOptions
    {
        public const string SectionName = "ExternalApis";

        public PokeApiOptions PokeApi { get; set; } = new();
        public DummyJsonOptions DummyJson { get; set; } = new();

        public BaseApiOptions GetOptions(string source)
        {
            return source.ToLowerInvariant() switch
            {
                "pokemon" => PokeApi,
                "product" => DummyJson,
                _ => throw new ArgumentException($"Unknown API source: {source}")
            };
        }
    }

    public abstract class BaseApiOptions
    {
        [Required]
        [Url]
        public string BaseUrl { get; set; } = string.Empty;

        [Range(1, 300)]
        public int TimeoutSeconds { get; set; } = 30;

        [Range(0, 10)]
        public int RetryAttempts { get; set; } = 3;

        [Range(1, 60)]
        public int CacheExpirationMinutes { get; set; } = 10;

        public abstract string GetEndpoint(int limit, int offset);
    }

    public class PokeApiOptions : BaseApiOptions
    {
        public PokeApiOptions()
        {
            BaseUrl = "https://pokeapi.co/api/v2/";
        }

        public override string GetEndpoint(int limit, int offset)
            => $"pokemon?limit={limit}&offset={offset}";
    }

    public class DummyJsonOptions : BaseApiOptions
    {
        public DummyJsonOptions()
        {
            BaseUrl = "https://dummyjson.com/";
        }

        public override string GetEndpoint(int limit, int offset)
            => $"products?limit={limit}&skip={offset}";
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