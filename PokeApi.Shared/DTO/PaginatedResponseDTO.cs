using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PokeApi.Shared.DTO
{
    public class PaginatedResponseDTO<T>
    {
        public T? Data { get; set; }
        public PaginationMetadata Pagination { get; set; } = new();
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? RequestId { get; set; }
    }

    public class PaginationMetadata
    {
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasNext { get; set; }
        public bool HasPrevious { get; set; }
        public string? NextUrl { get; set; }
        public string? PreviousUrl { get; set; }
        public int StartIndex { get; set; }
        public int EndIndex { get; set; }

        public static PaginationMetadata Create(int totalCount, int limit, int offset, string baseUrl)
        {
            var currentPage = (offset / limit) + 1;
            var totalPages = (int)Math.Ceiling((double)totalCount / limit);
            var hasNext = offset + limit < totalCount;
            var hasPrevious = offset > 0;

            var metadata = new PaginationMetadata
            {
                CurrentPage = currentPage,
                PageSize = limit,
                TotalCount = totalCount,
                TotalPages = totalPages,
                HasNext = hasNext,
                HasPrevious = hasPrevious,
                StartIndex = offset + 1,
                EndIndex = Math.Min(offset + limit, totalCount)
            };

            if (hasNext)
            {
                metadata.NextUrl = $"{baseUrl}?limit={limit}&offset={offset + limit}";
            }

            if (hasPrevious)
            {
                var previousOffset = Math.Max(0, offset - limit);
                metadata.PreviousUrl = $"{baseUrl}?limit={limit}&offset={previousOffset}";
            }

            return metadata;
        }
    }
}
