using static PokeApi.Shared.Models.PokemonModels;
using PokeApi.Shared.DTO;

namespace PokeApi.Wrapper.Interfaces
{
    public interface IPokeApiService
    {
        Task<ApiResponseDTO<PokemonListResponse>> GetPokemonList(int limit, int offset);
    }
}
