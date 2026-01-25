using FluentValidation;

namespace FixIt.Application.Features.AssignWorker;

public class AssignWorkerCommandValidator : AbstractValidator<AssignWorkerCommand>
{
    public AssignWorkerCommandValidator()
    {
        RuleFor(x => x.ServiceRequestId).NotEmpty().WithMessage("ServiceRequestId is required.");

        RuleFor(x => x.WorkerId).NotEmpty().WithMessage("WorkerId is required.");
    }
}
