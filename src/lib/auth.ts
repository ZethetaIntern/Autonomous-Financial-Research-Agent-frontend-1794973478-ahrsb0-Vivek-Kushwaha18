const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export type AuthUser = {
  id: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  created_at: string;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

type RegisterResponse = {
  message: string;
  email: string;
};

type MessageResponse = {
  message: string;
};

type ResetOTPResponse = {
  message: string;
  reset_token: string;
};

const TOKEN_KEY = "zetheta_access_token";
const USER_KEY = "zetheta_user";

async function readResponse<T>(response: Response): Promise<T> {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "Request failed."
    );
  }

  return result as T;
}

export async function registerUser(data: {
  full_name: string;
  email: string;
  password: string;
}): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return readResponse<RegisterResponse>(response);
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await readResponse<LoginResponse>(response);
  saveAuth(result);
  return result;
}

export async function verifyEmailOTP(
  email: string,
  otp: string
): Promise<MessageResponse> {
  const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  return readResponse<MessageResponse>(response);
}

export async function resendVerification(
  email: string
): Promise<MessageResponse> {
  const response = await fetch(`${API_URL}/api/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  return readResponse<MessageResponse>(response);
}

export async function forgotPassword(
  email: string
): Promise<MessageResponse> {
  const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  return readResponse<MessageResponse>(response);
}

export async function verifyPasswordResetOTP(
  email: string,
  otp: string
): Promise<ResetOTPResponse> {
  const response = await fetch(`${API_URL}/api/auth/verify-reset-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  return readResponse<ResetOTPResponse>(response);
}

export async function resetPassword(
  resetToken: string,
  newPassword: string
): Promise<MessageResponse> {
  const response = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reset_token: resetToken,
      new_password: newPassword,
    }),
  });

  return readResponse<MessageResponse>(response);
}

export function saveAuth(data: LoginResponse) {
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const value = localStorage.getItem(USER_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  const token = getAccessToken();

  if (!token) throw new Error("Please log in.");

  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    clearAuth();
    throw new Error("Your session has expired. Please log in again.");
  }

  return response.json();
}

export function clearAuth() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function logoutUser() {
  const token = getAccessToken();

  try {
    if (token) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } finally {
    clearAuth();
  }
}
