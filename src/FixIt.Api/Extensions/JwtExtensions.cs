using System.Net;
using System.Text;
using FixIt.Api.Middleware;
using FixIt.Application.Interfaces.Services;
using FixIt.Domain.Exceptions;
using FixIt.Infrastructure.Exceptions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace FixIt.Api.Extensions;

public static class JwtExtensions
{
    private const string SessionRevokedItemKey = "Auth.SessionRevoked";

    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        var jwtSettings = configuration.GetSection("Jwt");
        var secret = jwtSettings["Secret"];

        if (string.IsNullOrWhiteSpace(secret))
        {
            throw new ConfigurationException(
                "JWT Secret is not configured. Please set Jwt:Secret in appsettings.json"
            );
        }

        var key = Encoding.UTF8.GetBytes(secret);

        services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero,
                };

                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = ValidateSessionAsync,
                    OnChallenge = WriteChallengeAsync,
                };
            });

        return services;
    }

    // A signature-valid token is not enough: the account may have been deactivated or deleted,
    // or its password/role changed since the token was issued (TokenVersion bumped)
    private static async Task ValidateSessionAsync(TokenValidatedContext context)
    {
        var validator =
            context.HttpContext.RequestServices.GetRequiredService<IUserSessionValidator>();

        if (
            context.Principal is null
            || !await validator.IsValidAsync(context.Principal, context.HttpContext.RequestAborted)
        )
        {
            context.HttpContext.Items[SessionRevokedItemKey] = true;
            context.Fail("Session has been revoked.");
        }
    }

    // Replaces the default empty 401 with the standard error body so clients can tell a revoked
    // session apart from a missing/expired token
    private static Task WriteChallengeAsync(JwtBearerChallengeContext context)
    {
        context.HandleResponse();

        AppException error = context.HttpContext.Items.ContainsKey(SessionRevokedItemKey)
            ? new SessionRevokedException()
            : new UserNotAuthenticatedException();

        context.Response.Headers.WWWAuthenticate = JwtBearerDefaults.AuthenticationScheme;

        return ErrorResponseWriter.WriteAsync(
            context.HttpContext,
            HttpStatusCode.Unauthorized,
            error.ErrorCode,
            error.Message
        );
    }
}
