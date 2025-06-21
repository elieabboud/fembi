using System.Text.Json.Serialization;

namespace PokeApi.Shared.Models
{
    // Common interface for all API responses
    public interface IApiListResponse
    {
        int Total { get; }
        object Results { get; }
        string? Next { get; }
        string? Previous { get; }
    }

    // Pokemon API Models
    public class PokemonListResponse : IApiListResponse
    {
        [JsonPropertyName("count")]
        public int Count { get; set; }

        [JsonPropertyName("next")]
        public string? Next { get; set; }

        [JsonPropertyName("previous")]
        public string? Previous { get; set; }

        [JsonPropertyName("results")]
        public List<PokemonBasic> Results { get; set; } = new();

        // IApiListResponse implementation
        int IApiListResponse.Total => Count;
        object IApiListResponse.Results => Results;
    }

    public class PokemonBasic
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("url")]
        public string Url { get; set; } = string.Empty;
    }

    // Product API Models (DummyJSON)
    public class ProductListResponse : IApiListResponse
    {
        [JsonPropertyName("products")]
        public List<Product> Products { get; set; } = new();

        [JsonPropertyName("total")]
        public int Total { get; set; }

        [JsonPropertyName("skip")]
        public int Skip { get; set; }

        [JsonPropertyName("limit")]
        public int Limit { get; set; }

        // IApiListResponse implementation
        public string? Next => HasMore ? $"?limit={Limit}&skip={Skip + Limit}" : null;
        public string? Previous => Skip > 0 ? $"?limit={Limit}&skip={Math.Max(0, Skip - Limit)}" : null;
        object IApiListResponse.Results => Products;

        private bool HasMore => Skip + Limit < Total;
    }

    public class Product
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = string.Empty;

        [JsonPropertyName("price")]
        public decimal Price { get; set; }

        [JsonPropertyName("discountPercentage")]
        public decimal DiscountPercentage { get; set; }

        [JsonPropertyName("rating")]
        public decimal Rating { get; set; }

        [JsonPropertyName("stock")]
        public int Stock { get; set; }

        [JsonPropertyName("brand")]
        public string Brand { get; set; } = string.Empty;

        [JsonPropertyName("thumbnail")]
        public string Thumbnail { get; set; } = string.Empty;
    }

    // Supported API sources
    public static class ApiSources
    {
        public const string Pokemon = "pokemon";
        public const string Product = "product";

        public static readonly string[] ValidSources = { Pokemon, Product };

        public static bool IsValid(string source) => ValidSources.Contains(source, StringComparer.OrdinalIgnoreCase);
    }
}