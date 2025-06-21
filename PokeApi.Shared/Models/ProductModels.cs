using System.Text.Json.Serialization;

namespace PokeApi.Shared.Models
{
    public class ProductModels
    {
        public class ProductListResponse
        {
            [JsonPropertyName("products")]
            public List<Product> Products { get; set; } = new();

            [JsonPropertyName("total")]
            public int Total { get; set; }

            [JsonPropertyName("skip")]
            public int Skip { get; set; }

            [JsonPropertyName("limit")]
            public int Limit { get; set; }
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

            [JsonPropertyName("tags")]
            public List<string> Tags { get; set; } = new();

            [JsonPropertyName("brand")]
            public string? Brand { get; set; }

            [JsonPropertyName("sku")]
            public string Sku { get; set; } = string.Empty;

            [JsonPropertyName("weight")]
            public decimal? Weight { get; set; }

            [JsonPropertyName("thumbnail")]
            public string? Thumbnail { get; set; }

            [JsonPropertyName("images")]
            public List<string> Images { get; set; } = new();
        }
    }
}