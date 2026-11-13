namespace FixIt.Domain.Exceptions;

public class ServiceRequestSortInvalidException : BadRequestException
{
    public string Sort { get; }

    public ServiceRequestSortInvalidException(string sort)
        : base(
            errorCode: "SR_007_SORT_INVALID",
            message: $"Sort '{sort}' is invalid. Allowed fields: createdAt, title, status; directions: asc, desc."
        )
    {
        Sort = sort;
    }
}
