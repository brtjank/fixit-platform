using FixIt.Application;
using FixIt.Application.Interfaces.Services;
using FixIt.Infrastructure;
using FixIt.Worker.Messaging;
using FixIt.Worker.Services;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Serilog;

var builder = Host.CreateApplicationBuilder(args);

// Sinks and enrichers come from the "Serilog" section in appsettings, as in the API
Log.Logger = new LoggerConfiguration().ReadFrom.Configuration(builder.Configuration).CreateLogger();
builder.Services.AddSerilog();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Replaces the HTTP-based implementation (which needs IHttpContextAccessor and would fail DI validation)
builder.Services.Replace(
    ServiceDescriptor.Scoped<ICurrentUserService, NoHttpContextCurrentUserService>()
);

builder.Services.AddHostedService<QueueConsumer>();

try
{
    Log.Information("Starting FixIt.Platform Worker");
    builder.Build().Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Worker terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
