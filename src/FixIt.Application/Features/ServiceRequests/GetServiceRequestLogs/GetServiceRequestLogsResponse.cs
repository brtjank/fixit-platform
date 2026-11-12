using FixIt.Domain.Entities;

namespace FixIt.Application.Features.ServiceRequests.GetServiceRequestLogs;

public record GetServiceRequestLogsResponse(IReadOnlyList<ServiceLog> Logs);
