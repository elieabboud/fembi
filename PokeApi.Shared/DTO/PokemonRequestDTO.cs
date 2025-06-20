using PokeApi.Shared.Configurations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PokeApi.Shared.DTO
{
    public class PokemonRequestDTO
    {
        [PokemonLimit(1, 1000)]
        public int Limit { get; set; } = 20;

        [PokemonOffset]
        public int Offset { get; set; } = 0;

        public string? RequestId { get; set; }
    }
}

