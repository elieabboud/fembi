using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace PokeApi.Shared.Models
{
    public class PokemonModels
    {

        public class PokemonListResponse
        {
            [JsonPropertyName("count")]
            public int Count { get; set; }

            [JsonPropertyName("next")]
            public string? Next { get; set; }

            [JsonPropertyName("previous")]
            public string? Previous { get; set; }

            [JsonPropertyName("results")]
            public List<PokemonBasic> Results { get; set; } = new();
        }

        public class PokemonBasic
        {
            [JsonPropertyName("name")]
            public string Name { get; set; } = string.Empty;

            [JsonPropertyName("url")]
            public string Url { get; set; } = string.Empty;
        }
    }
}
