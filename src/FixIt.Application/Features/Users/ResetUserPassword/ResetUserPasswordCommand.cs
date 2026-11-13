using MediatR;

namespace FixIt.Application.Features.Users.ResetUserPassword;

public record ResetUserPasswordCommand(Guid UserId, string NewPassword) : IRequest;
