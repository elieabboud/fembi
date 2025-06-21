using PokeApi.Shared.DTO;
using static PokeApi.Shared.Models.PokemonModels;

namespace PokeApi.Internal.Interfaces
{
    public interface IWrapperApiService
    {
        Task<PaginatedResponseDTO<PokemonListResponse>> GetPokemonFromWrapper(int limit, int offset);
        Task<PaginatedResponseDTO<object>> GetPokemonViaMessaging(int limit, int offset, string correlationId);
    }
}
