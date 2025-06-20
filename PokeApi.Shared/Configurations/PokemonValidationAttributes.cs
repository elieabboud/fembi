using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PokeApi.Shared.Configurations
{
    public class PokemonLimitAttribute : ValidationAttribute
    {
        private readonly int _minValue;
        private readonly int _maxValue;

        public PokemonLimitAttribute(int minValue = 1, int maxValue = 1000)
        {
            _minValue = minValue;
            _maxValue = maxValue;
        }

        public override bool IsValid(object? value)
        {
            if (value is int limit)
            {
                return limit >= _minValue && limit <= _maxValue;
            }
            return false;
        }

        public override string FormatErrorMessage(string name)
        {
            return $"{name} must be between {_minValue} and {_maxValue}.";
        }
    }

    public class PokemonOffsetAttribute : ValidationAttribute
    {
        public override bool IsValid(object? value)
        {
            if (value is int offset)
            {
                return offset >= 0;
            }
            return false;
        }

        public override string FormatErrorMessage(string name)
        {
            return $"{name} must be a non-negative integer.";
        }
    }
}
