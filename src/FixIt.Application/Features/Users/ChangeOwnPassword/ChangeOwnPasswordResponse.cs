namespace FixIt.Application.Features.Users.ChangeOwnPassword;

/// <summary>
/// Changing the password revokes every token of the user, so the caller gets a fresh one
/// to keep the current session alive.
/// </summary>
public record ChangeOwnPasswordResponse(string Token);
