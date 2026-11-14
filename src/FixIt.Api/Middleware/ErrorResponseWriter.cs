using System.Net;
using System.Text.Json;

namespace FixIt.Api.Middleware;

/// <summary>
/// Writes the API error body ({ errorCode, message, requestId }). Shared by the exception
/// middleware and the JWT challenge handler so every error has the same shape.
/// </summary>
public static class ErrorResponseWriter
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static string? GetRequestId(HttpContext context) =>
        context.Items[RequestIdMiddleware.HttpContextItemKey]?.ToString();

    public static Task WriteAsync(
        HttpContext context,
        HttpStatusCode statusCode,
        string errorCode,
        string message
    )
    {
        var response = new ErrorResponse(errorCode, message, GetRequestId(context));

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        return context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
    }

    private record ErrorResponse(string ErrorCode, string Message, string? RequestId);
}
