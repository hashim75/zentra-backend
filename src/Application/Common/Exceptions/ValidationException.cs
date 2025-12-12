using System;

namespace Application.Common.Exceptions
{
    // Used when user sends bad data (e.g. "Duplicate Barcode")
    public class ValidationException : Exception
    {
        public ValidationException(string message) : base(message) { }
    }
    
    // Used when data is missing (e.g. "Delete Product ID 99" but 99 doesn't exist)
    public class NotFoundException : Exception
    {
        public NotFoundException(string name, object key)
            : base($"Entity \"{name}\" ({key}) was not found.") { }
    }
}