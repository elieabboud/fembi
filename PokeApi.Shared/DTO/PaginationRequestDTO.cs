using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PokeApi.Shared.DTO
{
    public class PaginationRequestDTO
    {
        public int Limit { get; set; } = 20;
        public int Offset { get; set; } = 0;
    }
}
