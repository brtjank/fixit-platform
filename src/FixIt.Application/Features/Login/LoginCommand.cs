using MediatR;

namespace FixIt.Application.Features.Login;

public record LoginCommand(string Email, string Password) : IRequest<LoginResponse>;
