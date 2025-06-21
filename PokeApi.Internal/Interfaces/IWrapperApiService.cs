using PokeApi.Shared.Configurations;
using PokeApi.Shared.DTO;
using PokeApi.Shared.Models;

namespace PokeApi.Internal.Interfaces
{
    public interface IWrapperApiService
    {
        Task<PaginatedResponseDTO<UnifiedResponse>> GetDataFromWrapper(ExternalApiSource source, int limit, int offset);
        Task<PaginatedResponseDTO<object>> GetDataViaMessaging(ExternalApiSource source, int limit, int offset, string correlationId);
    }
}