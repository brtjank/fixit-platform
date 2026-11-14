using System.Text.Json.Serialization;
using FixIt.Domain.Enums;
using FixIt.Domain.Exceptions;

namespace FixIt.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; private set; } = string.Empty;
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public UserRole Role { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Entities are serialised directly by the API, so the hash must be excluded explicitly.
    // Null means the account has no password yet and cannot sign in.
    [JsonIgnore]
    public string? PasswordHash { get; private set; }

    // Embedded in every JWT ("tv" claim) and compared on each request; bumping it revokes all
    // tokens issued so far. Internal security state, so it is never serialised.
    [JsonIgnore]
    public int TokenVersion { get; private set; }

    private User() { }

    public User(Guid tenantId, string email, string firstName, string lastName, UserRole role)
        : base(tenantId)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new UserEmailRequiredException();
        if (string.IsNullOrWhiteSpace(firstName))
            throw new UserNameRequiredException("FirstName");
        if (string.IsNullOrWhiteSpace(lastName))
            throw new UserNameRequiredException("LastName");

        Email = email;
        FirstName = firstName;
        LastName = lastName;
        Role = role;
    }

    public void UpdateName(string firstName, string lastName)
    {
        if (string.IsNullOrWhiteSpace(firstName))
            throw new UserNameRequiredException("FirstName");
        if (string.IsNullOrWhiteSpace(lastName))
            throw new UserNameRequiredException("LastName");

        FirstName = firstName;
        LastName = lastName;
    }

    public void SetPasswordHash(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new ArgumentException("Password hash cannot be empty.", nameof(passwordHash));

        PasswordHash = passwordHash;
        TokenVersion++;
    }

    public void ChangeRole(UserRole role)
    {
        if (Role == role)
            return;

        // The role is carried in the JWT, so tokens with the old role must stop working
        Role = role;
        TokenVersion++;
    }

    public void Deactivate()
    {
        IsActive = false;
        TokenVersion++;
    }

    public void Activate()
    {
        if (IsDeleted)
            throw new UserCannotBeActivatedException(Id);

        IsActive = true;
    }

    public new void SoftDelete()
    {
        IsDeleted = true;
        IsActive = false;
        TokenVersion++;
    }
}
