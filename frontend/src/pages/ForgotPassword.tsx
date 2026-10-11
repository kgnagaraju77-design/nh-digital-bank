import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      setMessage(
        "Your request was received. Email delivery must be configured before a reset link can be sent in production."
      );
    } catch (err: unknown) {
      const message = (
        err as {
          response?: {
            data?: { message?: string };
          };
        }
      )?.response?.data?.message;

      setError(
        message || "Unable to process the request. Please try again."
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
          maxWidth: 420,
          padding: 28,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 8px 30px rgba(15, 23, 42, 0.08)",
          boxSizing: "border-box",
        }}
      >
        <h1>Forgot Password?</h1>

        <p>
          Enter the email address associated with your NH Digital
          Bank account.
        </p>

        {error && (
          <p role="alert" style={{ color: "#b91c1c" }}>
            {error}
          </p>
        )}

        {message && (
          <p role="status" style={{ color: "#334155" }}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="reset-email">Email Address</label>

          <input
            id="reset-email"
            data-testid="forgot-password-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your registered email"
            style={{
              display: "block",
              width: "100%",
              boxSizing: "border-box",
              padding: 12,
              marginTop: 8,
              marginBottom: 18,
              border: "1px solid #cbd5e1",
              borderRadius: 6,
            }}
          />

          <button
            type="submit"
            data-testid="forgot-password-submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 12,
              background: "#123b70",
              color: "#fff",
              border: 0,
              borderRadius: 6,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Submitting..." : "Request Password Reset"}
          </button>
        </form>

        <p style={{ marginTop: 20 }}>
          <Link to="/login">Back to Login</Link>
        </p>
      </section>
    </main>
  );
}