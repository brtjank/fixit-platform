using FixIt.Domain.Entities;
using FixIt.Domain.Enums;

namespace FixIt.Application.Tests.Common.Builders;

public class UserBuilder
{
    private Guid _tenantId = Guid.NewGuid();
    private Guid _id = Guid.NewGuid();
    private string _email = "test@example.com";
    private string _firstName = "John";
    private string _lastName = "Doe";
    private UserRole _role = UserRole.Customer;
    private bool _isActive = true;

    public UserBuilder WithTenantId(Guid tenantId)
    {
        _tenantId = tenantId;
        return this;
    }

    public UserBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }

    public UserBuilder WithEmail(string email)
    {
        _email = email;
        return this;
    }

    public UserBuilder WithRole(UserRole role)
    {
        _role = role;
        return this;
    }

    public UserBuilder AsInactive()
    {
        _isActive = false;
        return this;
    }

    public User Build()
    {
        var user = new User(_tenantId, _email, _firstName, _lastName, _role);
        if (!_isActive)
        {
            user.Deactivate();
        }
        return user;
    }
}
