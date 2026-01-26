using System.Net;
using System.Text.Json;
using FixIt.Domain.Exceptions;

namespace FixIt.Api.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = exception switch
        {
            BadRequestException => HttpStatusCode.BadRequest,
            UnauthorizedException => HttpStatusCode.Unauthorized,
            ForbiddenException => HttpStatusCode.Forbidden,
            NotFoundException => HttpStatusCode.NotFound,
            AppException => HttpStatusCode.InternalServerError,
            _ => HttpStatusCode.InternalServerError
        };

        var errorCode = exception is AppException appEx ? appEx.ErrorCode : "ERR_001_UNEXPECTED";
        var requestId = context.Items[RequestIdMiddleware.HttpContextItemKey]?.ToString();

        // Log exception with context
        if (exception.InnerException != null)
        {
            _logger.LogError(
                exception,
                "Exception occurred. ErrorCode={ErrorCode}, Status={StatusCode}, RequestId={RequestId}, InnerException={InnerExceptionType}",
                errorCode,
                (int)statusCode,
                requestId,
                exception.InnerException.GetType().Name
            );
        }
        else
        {
            _logger.LogError(
                exception,
                "Exception occurred. ErrorCode={ErrorCode}, Status={StatusCode}, RequestId={RequestId}",
                errorCode,
                (int)statusCode,
                requestId
            );
        }

        var response = new ErrorResponse(
            ErrorCode: errorCode,
            Message: exception.Message,
            RequestId: requestId
        );

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        return context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }

    private record ErrorResponse(string ErrorCode, string Message, string? RequestId);
}
