namespace AuthService.Application.Exceptions;

/// <summary>
/// Thrown when a requested resource is not found.
/// </summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
    public NotFoundException(string name, object key) : base($"{name} with key '{key}' was not found.") { }
}
