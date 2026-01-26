namespace FixIt.Api.Middleware;

public class RequestIdMiddleware
{
    public const string HeaderName = "X-Request-Id";
    public const string HttpContextItemKey = "RequestId";

    private readonly RequestDelegate _next;

    public RequestIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = context.Request.Headers.TryGetValue(HeaderName, out var headerValue)
            ? headerValue.ToString()
            : Guid.NewGuid().ToString();

        context.Items[HttpContextItemKey] = requestId;
        context.Response.Headers[HeaderName] = requestId;

        await _next(context);
    }
}
