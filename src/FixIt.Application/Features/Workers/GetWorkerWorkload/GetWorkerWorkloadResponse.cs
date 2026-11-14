namespace FixIt.Application.Features.Workers.GetWorkerWorkload;

public record WorkerWorkload(Guid WorkerId, int Open, int InProgress, int CompletedLast30Days);

public record GetWorkerWorkloadResponse(IReadOnlyList<WorkerWorkload> Workers);
