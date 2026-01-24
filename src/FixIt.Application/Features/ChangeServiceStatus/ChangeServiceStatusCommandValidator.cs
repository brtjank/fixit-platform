using FluentValidation;

namespace FixIt.Application.Features.ChangeServiceStatus;

public class ChangeServiceStatusCommandValidator : AbstractValidator<ChangeServiceStatusCommand>
{
    public ChangeServiceStatusCommandValidator()
    {
        RuleFor(x => x.TenantId).NotEmpty().WithMessage("TenantId is required.");

        RuleFor(x => x.ServiceRequestId).NotEmpty().WithMessage("ServiceRequestId is required.");

        RuleFor(x => x.NewStatus)
            .IsInEnum()
            .WithMessage("NewStatus must be a valid ServiceRequestStatus value.");

        RuleFor(x => x.Notes)
            .MaximumLength(2000)
            .WithMessage("Notes must not exceed 2000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}
