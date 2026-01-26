using MediatR;

namespace FixIt.Application.Features.Auth.Login;

public record LoginCommand(string Email, string Password) : IRequest<LoginResponse>;
