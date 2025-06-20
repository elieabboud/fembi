using PokeApi.Shared.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static PokeApi.Shared.Models.PokemonModels;

namespace PokeApi.Shared.Interfaces
{
    public interface IExternalApiService
    {
        Task<ApiResponseDTO<PokemonListResponse>> GetPokemonList(int limit, int offset);
    }
}
