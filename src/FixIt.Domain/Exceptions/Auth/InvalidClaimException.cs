namespace FixIt.Domain.Exceptions;

public class InvalidClaimException : UnauthorizedException
{
    public string ClaimName { get; }

    public InvalidClaimException(string claimName, string reason)
        : base(errorCode: "AUTH_002_INVALID_CLAIM", message: $"{claimName} claim is {reason}.")
    {
        ClaimName = claimName;
    }
}
