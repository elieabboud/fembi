using System.ComponentModel.DataAnnotations;

namespace PokeApi.Shared.Configurations
{
    public class RabbitMQOptions
    {
        public const string SectionName = "RabbitMQ";

        [Required]
        public string HostName { get; set; } = "localhost";

        [Range(1, 65535)]
        public int Port { get; set; } = 5672;

        [Required]
        public string UserName { get; set; } = "guest";

        [Required]
        public string Password { get; set; } = "guest";

        public string VirtualHost { get; set; } = "/";

        [Range(1, 300)]
        public int ConnectionTimeoutSeconds { get; set; } = 30;

        [Range(1, 300)]
        public int RequestTimeoutSeconds { get; set; } = 30;

        [Range(1, 10)]
        public int RetryAttempts { get; set; } = 3;

        [Range(100, 10000)]
        public int RetryDelayMs { get; set; } = 1000;
    }

    public static class QueueNames
    {
        public const string PokemonRequest = "pokemon.request";
        public const string PokemonResponse = "pokemon.response";
        public const string PokemonRequestDLQ = "pokemon.request.dlq";
        public const string PokemonResponseDLQ = "pokemon.response.dlq";

        // FIXED: Added missing ApiRequest queue
        public const string ApiRequest = "api.request";
        public const string ApiResponse = "api.response";
        public const string ApiRequestDLQ = "api.request.dlq";
        public const string ApiResponseDLQ = "api.response.dlq";
    }

    public static class ExchangeNames
    {
        public const string Pokemon = "pokemon.exchange";
        public const string PokemonDLX = "pokemon.dlx";

        // FIXED: Added missing API exchange
        public const string Api = "api.exchange";
        public const string ApiDLX = "api.dlx";
    }

    public static class RoutingKeys
    {
        public const string PokemonRequest = "pokemon.request";
        public const string PokemonResponse = "pokemon.response";
        public const string PokemonRequestDLQ = "pokemon.request.dlq";
        public const string PokemonResponseDLQ = "pokemon.response.dlq";

        // FIXED: Added missing API routing keys
        public const string ApiRequest = "api.request";
        public const string ApiResponse = "api.response";
        public const string ApiRequestDLQ = "api.request.dlq";
        public const string ApiResponseDLQ = "api.response.dlq";
    }
}