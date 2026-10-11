import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (!resetToken.trim()) {
      setError(
        "Your reset link is missing its token. Request a new password reset."
      );
      return;
    }

    if (password.length < 8 || password.length > 100) {
      setError("Password must be between 8 and 100 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        resetToken,
        newPassword: password,
      });

      setSuccess(true);
    } catch (err: unknown) {
      const responseMessage = (
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      )?.response?.data?.message;

      setError(
        responseMessage ||
          "Unable to reset your password. Request a new reset link and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "#f1f5f9",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 430,
          padding: 28,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 8px 30px rgba(15, 23, 42, 0.08)",
          boxSizing: "border-box",
        }}
      >
        <h1>Reset Your Password</h1>

        {success ? (
          <>
            <p role="status">
              Your password has been reset successfully.
              You can now log in using your new password.
            </p>

            <Link to="/login">Continue to Login</Link>
          </>
        ) : (
          <>
            <p>
              Enter your new password below.
            </p>

            {error && (
              <div
                role="alert"
                style={{
                  color: "#b91c1c",
                  background: "#fef2f2",
                  padding: 12,
                  borderRadius: 6,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label htmlFor="new-password">
                New Password
              </label>

              <input
                id="new-password"
                data-testid="reset-new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={100}
                required
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                style={inputStyle}
              />

              <label htmlFor="confirm-password">
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                data-testid="reset-confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={100}
                required
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                style={inputStyle}
              />

              <button
                type="submit"
                data-testid="reset-password-submit"
                disabled={loading || !resetToken}
                style={{
                  width: "100%",
                  padding: 12,
                  border: 0,
                  borderRadius: 6,
                  background: "#123b70",
                  color: "#fff",
                  fontSize: 16,
                  cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              {!resetToken && (
                <p role="alert" style={{ color: "#b91c1c" }}>
                  This link has no reset token. Request a new link.
                </p>
              )}
            </form>

            <p style={{ marginTop: 20 }}>
              <Link to="/forgot-password">
                Request another reset link
              </Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box" as const,
  padding: 12,
  marginTop: 8,
  marginBottom: 18,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
};