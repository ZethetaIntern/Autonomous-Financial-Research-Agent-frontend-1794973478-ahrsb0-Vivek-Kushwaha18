"use client";

import { FormEvent, useState } from "react";
import {
  loginUser,
  registerUser,
  forgotPassword,
  verifyPasswordResetOTP,
  resetPassword,
  verifyEmailOTP,
  resendVerification,
  AuthUser,
} from "@/lib/auth";

type AuthMode =
  | "login"
  | "register"
  | "verify-email"
  | "verified"
  | "forgot"
  | "forgot-otp"
  | "reset";

type AuthPanelProps = {
  initialMode: "login" | "register";
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
};

export default function AuthPanel({
  initialMode,
  onClose,
  onLoginSuccess,
}: AuthPanelProps) {

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    setOtp("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (
      (mode === "register" || mode === "reset") &&
      password !== confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    if (
      (mode === "register" || mode === "reset") &&
      password.length < 8
    ) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (mode === "verify-email" && !/^\d{6}$/.test(otp)) {
      setError("Enter a valid six-digit verification code.");
      return;
    }

    if (mode === "forgot-otp" && !/^\d{6}$/.test(otp)) {
      setError("Enter a valid six-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const result = await loginUser({
          email: normalizedEmail,
          password,
        });

        onLoginSuccess(result.user);
        onClose();
        return;
      }

      if (mode === "register") {
        await registerUser({
          full_name: fullName.trim(),
          email: normalizedEmail,
          password,
        });

        setEmail(normalizedEmail);
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        setMode("verify-email");
        setMessage("A six-digit verification code has been sent to your email.");
        return;
      }

      if (mode === "verify-email") {
        const result = await verifyEmailOTP(normalizedEmail, otp.trim());

        setMessage(result.message || "Your email has been verified successfully.");
        setOtp("");
        setMode("verified");
        return;
      }

      if (mode === "forgot") {
        const result = await forgotPassword(normalizedEmail);
        setMessage(result.message);
        setMode("forgot-otp");
        return;
      }

      if (mode === "forgot-otp") {
        const result = await verifyPasswordResetOTP(
          normalizedEmail,
          otp.trim()
        );

        setResetToken(result.reset_token);
        setMode("reset");
        setOtp("");
        return;
      }

      if (mode === "reset") {
        const result = await resetPassword(resetToken, password);

        setMessage(
          result.message || "Your password has been reset successfully."
        );
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        setResetToken("");
        setMode("login");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong.";

      if (
        mode === "register" &&
        errorMessage.includes("An unverified account already exists")
      ) {
        setEmail(normalizedEmail);
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        setMode("verify-email");

        try {
          const result = await resendVerification(normalizedEmail);
          setMessage(
            result.message || "A new verification code has been sent to your email."
          );
        } catch (resendError) {
          setError(
            resendError instanceof Error
              ? resendError.message
              : "Please wait before requesting another OTP."
          );
        }

        return;
      }

      if (
        mode === "register" &&
        errorMessage.includes("An account with this email already exists")
      ) {
        setEmail(normalizedEmail);
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        setMode("login");
        setMessage("This email is already verified. Please log in.");
        return;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");
    setResending(true);

    try {
      const result = await resendVerification(email.trim().toLowerCase());
      setMessage(result.message || "A new verification code has been sent.");
      setOtp("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to resend verification code."
      );
    } finally {
      setResending(false);
    }
  }

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isVerifyEmail = mode === "verify-email";
  const isVerified = mode === "verified";
  const isForgot = mode === "forgot";
  const isForgotOTP = mode === "forgot-otp";
  const isReset = mode === "reset";

  return (
    <div
      className="marketing-auth-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="marketing-auth-wrap"
        role="dialog"
        aria-modal="true"
        aria-label="Zetheta account"
      >
        <div className="marketing-auth-card">
          <button
            type="button"
            className="marketing-auth-close"
            onClick={onClose}
            aria-label="Close authentication panel"
          >
            ×
          </button>

          <div className="marketing-auth-brand">
            <span className="marketing-auth-brand-mark">Z</span>
            <div>
              <strong>zetheta</strong>
              <small>FINANCIAL INTELLIGENCE</small>
            </div>
          </div>

          {(isLogin || isRegister) && (
            <div className="marketing-auth-tabs">
              <button
                type="button"
                className={isLogin ? "active" : ""}
                onClick={() => changeMode("login")}
              >
                Log in
              </button>
              <button
                type="button"
                className={isRegister ? "active" : ""}
                onClick={() => changeMode("register")}
              >
                Create account
              </button>
            </div>
          )}

          <div className="marketing-auth-heading">
            <h2>
              {isLogin && "Welcome back"}
              {isRegister && "Create your account"}
              {isVerifyEmail && "Verify your email"}
              {isVerified && "Email verified successfully"}
              {isForgot && "Forgot password?"}
              {isForgotOTP && "Verify your email"}
              {isReset && "Create new password"}
            </h2>

            <p>
              {isLogin && "Sign in to continue your financial research."}
              {isRegister && "Start your financial research journey with Zetheta."}
              {isVerifyEmail &&
                `Enter the six-digit code sent to ${email}. The code expires after 10 minutes.`}
              {isVerified &&
                "Your account email is verified. You can now sign in to Zetheta."}
              {isForgot && "Enter your registered email to receive a reset code."}
              {isForgotOTP &&
                `Enter the password reset code sent to ${email}.`}
              {isReset && "Choose a new password for your account."}
            </p>
          </div>

          {isVerified ? (
            <button
              type="button"
              className="marketing-auth-submit"
              onClick={() => {
                setPassword("");
                changeMode("login");
              }}
            >
              Continue to login <span>↗</span>
            </button>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="marketing-auth-form">
                {isRegister && (
                  <>
                    <label htmlFor="panel-full-name">Full name</label>
                    <input
                      id="panel-full-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      autoComplete="name"
                      minLength={2}
                      maxLength={150}
                      required
                    />
                  </>
                )}

                {(isLogin || isRegister || isForgot) && (
                  <>
                    <label htmlFor="panel-email">Email address</label>
                    <input
                      id="panel-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      required
                    />
                  </>
                )}

                {isVerifyEmail && (
                  <>
                    <label htmlFor="panel-verify-email">Registered email</label>
                    <input
                      id="panel-verify-email"
                      type="email"
                      value={email}
                      readOnly
                      autoComplete="email"
                    />

                    <label htmlFor="panel-registration-otp">
                      Six-digit verification code
                    </label>
                    <input
                      id="panel-registration-otp"
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(event) =>
                        setOtp(
                          event.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      maxLength={6}
                      autoComplete="one-time-code"
                      autoFocus
                      required
                    />

                    <div className="marketing-auth-forgot">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                      >
                        {resending ? "Sending..." : "Resend verification code"}
                      </button>
                    </div>
                  </>
                )}

                {(isLogin || isRegister || isReset) && (
                  <>
                    <label htmlFor="panel-password">
                      {isReset ? "New password" : "Password"}
                    </label>
                    <input
                      id="panel-password"
                      type="password"
                      placeholder={
                        isLogin ? "Enter your password" : "At least 8 characters"
                      }
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete={
                        isLogin ? "current-password" : "new-password"
                      }
                      minLength={isLogin ? undefined : 8}
                      maxLength={128}
                      required
                    />
                  </>
                )}

                {(isRegister || isReset) && (
                  <>
                    <label htmlFor="panel-confirm-password">
                      Confirm password
                    </label>
                    <input
                      id="panel-confirm-password"
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      autoComplete="new-password"
                      required
                    />
                  </>
                )}

                {isForgotOTP && (
                  <>
                    <label htmlFor="panel-reset-otp">
                      Six-digit verification code
                    </label>
                    <input
                      id="panel-reset-otp"
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(event) =>
                        setOtp(
                          event.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      inputMode="numeric"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                    />
                  </>
                )}

                {isLogin && (
                  <div className="marketing-auth-forgot">
                    <button
                      type="button"
                      onClick={() => changeMode("forgot")}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {error && (
                  <div className="marketing-auth-error">{error}</div>
                )}
                {message && (
                  <div className="marketing-auth-message">{message}</div>
                )}

                <button
                  type="submit"
                  className="marketing-auth-submit"
                  disabled={loading}
                >
                  {loading
                    ? "Please wait..."
                    : isLogin
                      ? "Sign in"
                      : isRegister
                        ? "Create account"
                        : isVerifyEmail
                          ? "Verify email"
                          : isForgot
                            ? "Send reset code"
                            : isForgotOTP
                              ? "Verify code"
                              : "Reset password"}
                  {!loading && <span>↗</span>}
                </button>
              </form>

              {isVerifyEmail && (
                <p className="marketing-auth-switch">
                  Wrong email?{" "}
                  <button
                    type="button"
                    onClick={() => changeMode("register")}
                  >
                    Register again
                  </button>
                </p>
              )}

              {isLogin && (
                <p className="marketing-auth-switch">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => changeMode("register")}
                  >
                    Create account
                  </button>
                </p>
              )}

              {isRegister && (
                <p className="marketing-auth-switch">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => changeMode("login")}
                  >
                    Sign in
                  </button>
                </p>
              )}

              {(isForgot || isForgotOTP || isReset) && (
                <p className="marketing-auth-switch">
                  <button
                    type="button"
                    onClick={() => changeMode("login")}
                  >
                    Back to login
                  </button>
                </p>
              )}
            </>
          )}

          <div className="marketing-auth-security">
            <span>✳</span>
            Secure access to your financial research workspace
          </div>
        </div>
      </section>
    </div>
  );
}
