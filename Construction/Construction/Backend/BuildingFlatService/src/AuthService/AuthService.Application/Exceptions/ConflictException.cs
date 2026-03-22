namespace AuthService.Application.Exceptions;

/// <summary>
/// Thrown when a business rule conflict occurs (e.g., duplicate username).
/// </summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}
