using System.ComponentModel.DataAnnotations;
using PokeApi.Shared.Models;

namespace PokeApi.Shared.Configurations
{
    public class ApiLimitAttribute : ValidationAttribute
    {
        private readonly int _minValue;
        private readonly int _maxValue;

        public ApiLimitAttribute(int minValue = 1, int maxValue = 1000)
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

    public class ApiOffsetAttribute : ValidationAttribute
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

    public class ApiSourceAttribute : ValidationAttribute
    {
        public override bool IsValid(object? value)
        {
            if (value is string source)
            {
                return ApiSources.IsValid(source);
            }
            return false;
        }

        public override string FormatErrorMessage(string name)
        {
            return $"{name} must be one of: {string.Join(", ", ApiSources.ValidSources)}.";
        }
    }
}