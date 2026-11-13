using MediatR;

namespace FixIt.Application.Features.Users.ChangeOwnPassword;

public record ChangeOwnPasswordCommand(string CurrentPassword, string NewPassword) : IRequest;
