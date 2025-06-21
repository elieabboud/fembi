// PokeApi.Shared/Interfaces/IExternalApiService.cs
using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Models;

namespace PokeApi.Shared.Interfaces
{
    public interface IExternalApiService
    {
        Task<PaginatedResponseDTO<UnifiedResponse>> GetDataAsync(ExternalApiSource source, int limit, int offset);
    }
    public interface IPokemonApiService
    {
        Task<PaginatedResponseDTO<PokemonModels.PokemonListResponse>> GetPokemonListAsync(int limit, int offset);
    }

    public interface IProductApiService
    {
        Task<PaginatedResponseDTO<ProductModels.ProductListResponse>> GetProductListAsync(int limit, int skip);
    }

    public interface IExternalApiClientFactory
    {
        HttpClient CreatePokemonClient();
        HttpClient CreateProductClient();
    }
}