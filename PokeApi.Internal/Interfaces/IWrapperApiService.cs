using PokeApi.Shared.DTO;
using static PokeApi.Shared.Models.PokemonModels;

namespace PokeApi.Internal.Interfaces
{
    public interface IWrapperApiService
    {
        Task<PaginatedResponseDTO<PokemonListResponse>> GetPokemonFromWrapperAsync(int limit, int offset);
    }
}
