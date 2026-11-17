type SupabaseLikeError = {
  message: string;
  code?: string;
  status?: number;
};

/** Maps Supabase Auth errors to copy that helps a merchant recover. */
export function describeAuthError(error: SupabaseLikeError): string {
  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "Email or password is incorrect. Check both and try again.";
  }

  if (message.includes("email not confirmed")) {
    return "Confirm your email first. We sent you a verification link at sign-up.";
  }

  if (message.includes("user already registered")) {
    return "An account with this email already exists. Sign in instead.";
  }

  if (message.includes("password should be")) {
    return "Choose a stronger password with at least 8 characters, one letter and one number.";
  }

  if (message.includes("email rate limit") || message.includes("rate limit")) {
    return "Too many attempts in a short time. Wait a minute, then try again.";
  }

  if (message.includes("signups not allowed")) {
    return "New registrations are temporarily closed. Contact support@tuma.africa.";
  }

  if (message.includes("unable to validate email")) {
    return "That email address could not be accepted. Check it and try again.";
  }

  if (message.includes("auth session missing")) {
    return "Your session has expired. Request a new link and try again.";
  }

  if (message.includes("token has expired") || message.includes("invalid token")) {
    return "This link has expired or was already used. Request a new one.";
  }

  if (error.status === 0 || message.includes("fetch failed")) {
    return "We could not reach the authentication service. Check your connection and try again.";
  }

  return "We could not complete that request. Try again in a moment.";
}
