using PokeApi.Shared.DTO;

namespace PokeApi.Shared.Interfaces
{
    public interface IExternalApiService
    {
        Task<PaginatedResponseDTO<object>> GetDataAsync(string source, int limit, int offset);
    }

    public interface IApiHttpClientFactory
    {
        HttpClient CreateClient(string source);
    }

    public interface IApiMessageService
    {
        Task<PaginatedResponseDTO<object>?> RequestDataAsync(string source, int limit, int offset,
            string correlationId, CancellationToken cancellationToken = default);
        Task StartProcessingRequestsAsync(CancellationToken cancellationToken = default);
        Task StopProcessingAsync();
    }
}