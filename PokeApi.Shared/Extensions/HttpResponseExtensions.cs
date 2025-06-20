using Microsoft.AspNetCore.Http;

namespace PokeApi.Shared.Extensions
{

    public static class HttpResponseExtensions
    {

        public static void AddOrUpdateHeader(this HttpResponse response, string key, string value)
        {
            if (response.Headers.ContainsKey(key))
            {
                response.Headers.Remove(key);
            }
            response.Headers.Add(key, value);
        }


        public static void TryAddHeader(this HttpResponse response, string key, string value)
        {
            if (!response.Headers.ContainsKey(key))
            {
                response.Headers.Add(key, value);
            }
        }
    }
}