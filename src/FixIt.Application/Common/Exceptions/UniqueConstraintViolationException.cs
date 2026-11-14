namespace FixIt.Application.Common.Exceptions;

/// <summary>
/// Thrown by repositories when the database rejects a write because of a unique constraint/index.
/// Keeps Application free of provider types; handlers translate known constraints into
/// domain exceptions and let unknown ones bubble up as unexpected errors (500).
/// </summary>
public class UniqueConstraintViolationException : Exception
{
    public string ConstraintName { get; }

    public UniqueConstraintViolationException(string constraintName, Exception innerException)
        : base($"Unique constraint '{constraintName}' was violated.", innerException)
    {
        ConstraintName = constraintName;
    }
}
