namespace AuthService.Application.Exceptions;

/// <summary>
/// Thrown when a user is not authorized to perform an action.
/// </summary>
public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message) : base(message) { }
    public UnauthorizedException() : base("You are not authorized to perform this action.") { }
}
