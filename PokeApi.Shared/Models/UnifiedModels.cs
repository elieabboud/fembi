using System.Text.Json.Serialization;
using PokeApi.Shared.Configurations;

namespace PokeApi.Shared.Models
{

    public class UnifiedResponse
    {
        [JsonPropertyName("source")]
        public ExternalApiSource Source { get; set; }

        [JsonPropertyName("data")]
        public object? Data { get; set; }

        [JsonPropertyName("count")]
        public int Count { get; set; }

        [JsonPropertyName("limit")]
        public int Limit { get; set; }

        [JsonPropertyName("offset")]
        public int Offset { get; set; }

        [JsonPropertyName("hasNext")]
        public bool HasNext { get; set; }

        [JsonPropertyName("hasPrevious")]
        public bool HasPrevious { get; set; }

        [JsonPropertyName("next")]
        public string? Next { get; set; }

        [JsonPropertyName("previous")]
        public string? Previous { get; set; }

        public static UnifiedResponse FromPokemonResponse(PokemonModels.PokemonListResponse pokemon, int limit, int offset)
        {
            return new UnifiedResponse
            {
                Source = ExternalApiSource.Pokemon,
                Data = pokemon.Results,
                Count = pokemon.Count,
                Limit = limit,
                Offset = offset,
                HasNext = !string.IsNullOrEmpty(pokemon.Next),
                HasPrevious = !string.IsNullOrEmpty(pokemon.Previous),
                Next = pokemon.Next,
                Previous = pokemon.Previous
            };
        }

        public static UnifiedResponse FromProductResponse(ProductModels.ProductListResponse products, int limit, int skip)
        {
            return new UnifiedResponse
            {
                Source = ExternalApiSource.Product,
                Data = products.Products,
                Count = products.Total,
                Limit = limit,
                Offset = skip,
                HasNext = skip + limit < products.Total,
                HasPrevious = skip > 0,
                Next = skip + limit < products.Total ? $"?limit={limit}&skip={skip + limit}" : null,
                Previous = skip > 0 ? $"?limit={limit}&skip={Math.Max(0, skip - limit)}" : null
            };
        }
    }
}