using PokeApi.Shared.DTO;

namespace PokeApi.Internal.Interfaces
{
    public interface IWrapperApiService
    {
        Task<PaginatedResponseDTO<object>> GetDataFromWrapper(string source, int limit, int offset);
        Task<PaginatedResponseDTO<object>> GetDataViaMessaging(string source, int limit, int offset, string correlationId);
    }
}