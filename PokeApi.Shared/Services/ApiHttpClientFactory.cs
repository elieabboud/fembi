using Microsoft.Extensions.Options;
using PokeApi.Shared.Configurations;
using PokeApi.Shared.Interfaces;
using PokeApi.Shared.Models;

namespace PokeApi.Shared.Services
{
    public class ApiHttpClientFactory : IApiHttpClientFactory
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ExternalApiOptions _options;

        public ApiHttpClientFactory(IHttpClientFactory httpClientFactory, IOptions<ExternalApiOptions> options)
        {
            _httpClientFactory = httpClientFactory;
            _options = options.Value;
        }

        public HttpClient CreateClient(string source)
        {
            if (!ApiSources.IsValid(source))
            {
                throw new ArgumentException($"Invalid API source: {source}");
            }

            // Use named HTTP clients for each API source
            return source.ToLowerInvariant() switch
            {
                ApiSources.Pokemon => _httpClientFactory.CreateClient("PokeApi"),
                ApiSources.Product => _httpClientFactory.CreateClient("DummyJson"),
                _ => throw new ArgumentException($"Unknown API source: {source}")
            };
        }
    }
}