namespace FixIt.Application.Features.Users.ChangeOwnPassword;

public record ChangeOwnPasswordRequest(string CurrentPassword, string NewPassword);
