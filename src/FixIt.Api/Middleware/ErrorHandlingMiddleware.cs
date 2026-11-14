using System.Net;
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
            ConflictException => HttpStatusCode.Conflict,
            AppException => HttpStatusCode.InternalServerError,
            _ => HttpStatusCode.InternalServerError
        };

        var errorCode = exception is AppException appEx ? appEx.ErrorCode : "ERR_001_UNEXPECTED";
        var requestId = ErrorResponseWriter.GetRequestId(context);

        // Expected client errors (4xx) are part of normal operation: log a one-line warning.
        // Anything mapped to 5xx is a real failure and gets the full exception.
        if ((int)statusCode < 500)
        {
            _logger.LogWarning(
                "Request failed. ErrorCode={ErrorCode}, Status={StatusCode}, RequestId={RequestId}, Message={Message}",
                errorCode,
                (int)statusCode,
                requestId,
                exception.Message
            );
        }
        else if (exception.InnerException != null)
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

        return ErrorResponseWriter.WriteAsync(context, statusCode, errorCode, exception.Message);
    }
}
