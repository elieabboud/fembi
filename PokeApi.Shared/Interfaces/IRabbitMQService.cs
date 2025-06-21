using PokeApi.Shared.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PokeApi.Shared.Interfaces
{
    public interface IRabbitMQService : IDisposable
    {
        Task<bool> PublishAsync<T>(string exchange, string routingKey, T message, string? correlationId = null,
            Dictionary<string, object>? headers = null, CancellationToken cancellationToken = default);

        Task<TResponse?> PublishAndWaitForReplyAsync<TRequest, TResponse>(string exchange, string routingKey,
            TRequest request, string replyQueue, TimeSpan timeout, string? correlationId = null,
            CancellationToken cancellationToken = default);

        Task StartConsumingAsync<T>(string queueName, Func<MessageEnvelope<T>, Task<bool>> messageHandler,
            CancellationToken cancellationToken = default);

        Task StopConsumingAsync(string queueName);

        Task<bool> IsHealthyAsync();

        void DeclareInfrastructure();
    }

    public interface IPokemonMessageService
    {
        Task<PaginatedResponseDTO<object>?> RequestPokemonDataAsync(int limit, int offset, string correlationId,
            CancellationToken cancellationToken = default);

        Task StartProcessingRequestsAsync(CancellationToken cancellationToken = default);

        Task StopProcessingAsync();
    }
}
