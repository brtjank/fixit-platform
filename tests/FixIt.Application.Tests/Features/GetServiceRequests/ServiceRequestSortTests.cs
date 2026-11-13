using FixIt.Application.Features.ServiceRequests.GetServiceRequests;
using FixIt.Domain.Exceptions;
using FluentAssertions;
using Xunit;

namespace FixIt.Application.Tests.Features.GetServiceRequests;

public class ServiceRequestSortTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Parse_BlankValue_ReturnsCreatedAtDescending(string? value)
    {
        var sort = ServiceRequestSort.Parse(value);

        sort.Should().Be(new ServiceRequestSort(ServiceRequestSortField.CreatedAt, true));
    }

    [Theory]
    [InlineData("createdAt:asc", ServiceRequestSortField.CreatedAt, false)]
    [InlineData("createdAt:desc", ServiceRequestSortField.CreatedAt, true)]
    [InlineData("title:asc", ServiceRequestSortField.Title, false)]
    [InlineData("title:desc", ServiceRequestSortField.Title, true)]
    [InlineData("status:asc", ServiceRequestSortField.Status, false)]
    [InlineData("status:desc", ServiceRequestSortField.Status, true)]
    [InlineData("title", ServiceRequestSortField.Title, false)]
    [InlineData("CREATEDAT:DESC", ServiceRequestSortField.CreatedAt, true)]
    [InlineData("Status:Asc", ServiceRequestSortField.Status, false)]
    [InlineData(" title : desc ", ServiceRequestSortField.Title, true)]
    public void Parse_ValidValue_ReturnsFieldAndDirection(
        string value,
        ServiceRequestSortField expectedField,
        bool expectedDescending
    )
    {
        var sort = ServiceRequestSort.Parse(value);

        sort.Field.Should().Be(expectedField);
        sort.Descending.Should().Be(expectedDescending);
    }

    [Theory]
    [InlineData("priority:asc")]
    [InlineData("id")]
    [InlineData("title:up")]
    [InlineData("title:")]
    [InlineData(":desc")]
    [InlineData("title:asc:desc")]
    public void Parse_InvalidValue_ThrowsServiceRequestSortInvalidException(string value)
    {
        var act = () => ServiceRequestSort.Parse(value);

        var exception = act.Should().Throw<ServiceRequestSortInvalidException>().Which;
        exception.ErrorCode.Should().Be("SR_007_SORT_INVALID");
        exception.Message.Should().Contain($"'{value}'");
    }
}
