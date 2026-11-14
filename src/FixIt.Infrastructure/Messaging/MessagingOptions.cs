namespace FixIt.Infrastructure.Messaging;

public class MessagingOptions
{
    public const string SectionName = "Messaging";

    public string QueueConnectionString { get; set; } = "UseDevelopmentStorage=true";
    public string QueueName { get; set; } = "service-request-events";
    public int OutboxPollIntervalSeconds { get; set; } = 2;
    public int OutboxBatchSize { get; set; } = 20;

    public string PoisonQueueName => QueueName + "-poison";
}
